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
          const params = new URLSearchParams(context.params as Record<string, string>)
          params.set('openid.mode', 'check_authentication')
          const res = await fetch(STEAM_OPENID_URL + '/login', {
            method: 'POST',
            body: params,
          })
          const text = await res.text()
          const isValid = text.includes('is_valid:true')
          if (!isValid) throw new Error('Steam OpenID validation failed')
          const claimedId = (context.params as Record<string, string>)['openid.claimed_id'] || ''
          const steamId = claimedId.replace('https://steamcommunity.com/openid/id/', '')
          return { tokens: { access_token: steamId } }
        },
      },
      userinfo: {
        url: 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/',
        async request(context) {
          const steamId = context.tokens.access_token
          const apiKey = process.env.STEAM_API_KEY
          const res = await fetch(
            `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`
          )
          const data = await res.json()
          const player = data.response.players[0]
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
  callbacks: {
    async signIn({ user, profile }) {
      const p = profile as { steamId?: string; id?: string; profileUrl?: string } | undefined
      const steamId = p?.steamId || p?.id || user.id
      if (!steamId) return false

      try {
        const supabase = createServiceClient()

        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('steam_id', steamId)
          .single()

        if (existing) {
          await supabase
            .from('users')
            .update({
              username: user.name || 'Unknown',
              avatar_url: user.image || '',
              steam_profile_url: p?.profileUrl || '',
            })
            .eq('steam_id', steamId)
        } else {
          await supabase.from('users').insert({
            steam_id: steamId,
            username: user.name || 'Unknown',
            avatar_url: user.image || '',
            steam_profile_url: p?.profileUrl || '',
            reputation: 0,
            created_at: new Date().toISOString(),
          })
        }
      } catch (err) {
        console.error('[auth] signIn DB error:', err)
      }

      return true
    },

    async jwt({ token, user, profile }) {
      // Only runs on initial sign-in when profile is present
      if (profile) {
        const p = profile as { steamId?: string; id?: string; profileUrl?: string }
        const steamId = p.steamId || p.id || user?.id || ''

        token.steamId = steamId
        token.profileUrl = p.profileUrl || ''
        token.username = user?.name || ''
        token.avatar_url = user?.image || ''

        if (steamId) {
          try {
            const supabase = createServiceClient()
            const { data } = await supabase
              .from('users')
              .select('id, username, avatar_url, steam_profile_url')
              .eq('steam_id', steamId)
              .single()

            if (data) {
              token.supabaseUserId = data.id
              token.username = data.username
              token.avatar_url = data.avatar_url
              token.profileUrl = data.steam_profile_url || token.profileUrl
            }
          } catch (err) {
            console.error('[auth] jwt DB lookup error:', err)
          }
        }
      }

      return token
    },

    async session({ session, token }) {
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
