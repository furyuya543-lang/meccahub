import { NextAuthOptions } from 'next-auth'
import { createServiceClient } from './supabase'

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid'

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: 'steam',
      name: 'Steam',
      type: 'oauth',
      checks: ['none'],
      authorization: {
        url: STEAM_OPENID_URL + '/login',
        params: {
          'openid.ns': 'http://specs.openid.net/auth/2.0',
          'openid.mode': 'checkid_setup',
          'openid.return_to': `${process.env.NEXTAUTH_URL}/api/auth/callback/steam`,
          'openid.realm': process.env.NEXTAUTH_URL,
          'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
          'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
        },
      },
      token: {
        url: STEAM_OPENID_URL + '/login',
        async request(context) {
          console.log('[auth] token.request called, params keys:', Object.keys(context.params || {}))
          const params = new URLSearchParams(context.params as Record<string, string>)
          params.set('openid.mode', 'check_authentication')

          const res = await fetch(STEAM_OPENID_URL + '/login', {
            method: 'POST',
            body: params,
          })
          const text = await res.text()
          console.log('[auth] steam check_authentication response:', text.slice(0, 200))

          const isValid = text.includes('is_valid:true')
          if (!isValid) {
            console.error('[auth] Steam OpenID validation failed. Response:', text)
            throw new Error('Steam OpenID validation failed')
          }

          const claimedId = (context.params as Record<string, string>)['openid.claimed_id'] || ''
          const steamId = claimedId.replace('https://steamcommunity.com/openid/id/', '')
          console.log('[auth] token.request resolved steamId:', steamId)
          return { tokens: { access_token: steamId } }
        },
      },
      userinfo: {
        url: 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/',
        async request(context) {
          const steamId = context.tokens.access_token
          const apiKey = process.env.STEAM_API_KEY
          console.log('[auth] userinfo.request, steamId:', steamId, '| apiKey set:', !!apiKey && apiKey !== 'placeholder')

          if (!apiKey || apiKey === 'placeholder') {
            console.error('[auth] STEAM_API_KEY is not configured — returning minimal profile')
            return {
              id: steamId,
              steamId,
              name: `Steam User`,
              image: '',
              profileUrl: `https://steamcommunity.com/profiles/${steamId}`,
            }
          }

          const res = await fetch(
            `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`
          )
          const data = await res.json()
          const player = data?.response?.players?.[0]

          if (!player) {
            console.error('[auth] No player returned from Steam API for steamId:', steamId, '| raw:', JSON.stringify(data).slice(0, 300))
            return {
              id: steamId,
              steamId,
              name: `Steam User`,
              image: '',
              profileUrl: `https://steamcommunity.com/profiles/${steamId}`,
            }
          }

          console.log('[auth] player fetched:', player.personaname)
          return {
            id: steamId,
            steamId,
            name: player.personaname,
            image: player.avatarfull,
            profileUrl: player.profileurl,
          }
        },
      },
      clientId: 'steam',
      clientSecret: process.env.STEAM_API_KEY!,
      profile(profile: { id: string; steamId: string; name: string; image: string; profileUrl: string }) {
        console.log('[auth] profile() called for steamId:', profile.steamId)
        return {
          id: profile.steamId,
          name: profile.name,
          image: profile.image,
          email: null,
          steamId: profile.steamId,
          profileUrl: profile.profileUrl,
        }
      },
    },
  ],

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    async signIn({ user, profile }) {
      const p = profile as { steamId?: string; id?: string; profileUrl?: string } | undefined
      const steamId = p?.steamId || p?.id || user.id
      console.log('[auth] signIn callback, steamId:', steamId, '| user.id:', user.id)

      if (!steamId) {
        console.error('[auth] signIn: no steamId found — blocking sign in')
        return false
      }

      try {
        const supabase = createServiceClient()

        const { data: existing, error: selectErr } = await supabase
          .from('users')
          .select('id')
          .eq('steam_id', steamId)
          .single()

        if (selectErr && selectErr.code !== 'PGRST116') {
          console.error('[auth] signIn select error:', selectErr)
        }

        if (existing) {
          const { error: updateErr } = await supabase
            .from('users')
            .update({
              username: user.name || 'Unknown',
              avatar_url: user.image || '',
              steam_profile_url: p?.profileUrl || '',
            })
            .eq('steam_id', steamId)
          if (updateErr) console.error('[auth] signIn update error:', updateErr)
          else console.log('[auth] signIn: updated existing user', existing.id)
        } else {
          const { error: insertErr } = await supabase.from('users').insert({
            steam_id: steamId,
            username: user.name || 'Unknown',
            avatar_url: user.image || '',
            steam_profile_url: p?.profileUrl || '',
            reputation: 0,
            created_at: new Date().toISOString(),
          })
          if (insertErr) console.error('[auth] signIn insert error:', insertErr)
          else console.log('[auth] signIn: inserted new user for steamId', steamId)
        }
      } catch (err) {
        console.error('[auth] signIn DB error (non-fatal):', err)
      }

      return true
    },

    async jwt({ token, user, profile }) {
      if (profile) {
        const p = profile as { steamId?: string; id?: string; profileUrl?: string }
        const steamId = p.steamId || p.id || user?.id || ''
        console.log('[auth] jwt callback (initial sign-in), steamId:', steamId)

        token.steamId = steamId
        token.profileUrl = p.profileUrl || ''
        token.username = user?.name || ''
        token.avatar_url = user?.image || ''

        if (steamId) {
          try {
            const supabase = createServiceClient()
            const { data, error } = await supabase
              .from('users')
              .select('id, username, avatar_url, steam_profile_url')
              .eq('steam_id', steamId)
              .single()

            if (error) {
              console.error('[auth] jwt DB lookup error:', error)
            } else if (data) {
              token.supabaseUserId = data.id
              token.username = data.username
              token.avatar_url = data.avatar_url
              token.profileUrl = data.steam_profile_url || token.profileUrl
              console.log('[auth] jwt: loaded supabase user', data.id)
            }
          } catch (err) {
            console.error('[auth] jwt DB lookup exception:', err)
          }
        }
      }

      return token
    },

    async session({ session, token }) {
      console.log('[auth] session callback, token.steamId:', token.steamId)
      if (session.user) {
        const u = session.user as typeof session.user & {
          steamId: string
          profileUrl: string
          supabaseUserId: string
          username: string
          avatar_url: string
        }
        u.steamId = (token.steamId as string) || ''
        u.profileUrl = (token.profileUrl as string) || ''
        u.supabaseUserId = (token.supabaseUserId as string) || ''
        u.username = (token.username as string) || session.user.name || ''
        u.avatar_url = (token.avatar_url as string) || session.user.image || ''
      }
      return session
    },
  },

  pages: {
    signIn: '/',
    error: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
