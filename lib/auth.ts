import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createServiceClient } from './supabase'
import { verifySteamToken } from './steam-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'steam-credentials',
      name: 'Steam',
      credentials: {
        token: { label: 'Token', type: 'text' },
      },
      async authorize(credentials) {
        const steamId = verifySteamToken(credentials?.token || '')
        console.log('[auth] credentials authorize, steamId:', steamId)
        if (!steamId) return null

        const apiKey = process.env.STEAM_API_KEY
        let name = 'Steam User'
        let image = ''
        let profileUrl = `https://steamcommunity.com/profiles/${steamId}`

        if (apiKey && apiKey !== 'placeholder') {
          try {
            const res = await fetch(
              `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`
            )
            const data = await res.json()
            const player = data?.response?.players?.[0]
            if (player) {
              name = player.personaname
              image = player.avatarfull
              profileUrl = player.profileurl
              console.log('[auth] fetched Steam player:', name)
            } else {
              console.error('[auth] no player from Steam API for', steamId, JSON.stringify(data).slice(0, 200))
            }
          } catch (err) {
            console.error('[auth] Steam API fetch error:', err)
          }
        } else {
          console.error('[auth] STEAM_API_KEY not configured — using minimal profile')
        }

        return {
          id: steamId,
          steamId,
          name,
          image,
          email: null,
          profileUrl,
        } as any
      },
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    async signIn({ user, account }) {
      const u = user as any
      const steamId = u?.steamId || u?.id || ''
      console.log('[auth] signIn callback, provider:', account?.provider, 'steamId:', steamId)

      if (!steamId) {
        console.error('[auth] signIn: no steamId — blocking')
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
              steam_profile_url: u?.profileUrl || '',
            })
            .eq('steam_id', steamId)
          if (updateErr) console.error('[auth] signIn update error:', updateErr)
          else console.log('[auth] signIn: updated user', existing.id)
        } else {
          const { error: insertErr } = await supabase.from('users').insert({
            steam_id: steamId,
            username: user.name || 'Unknown',
            avatar_url: user.image || '',
            steam_profile_url: u?.profileUrl || '',
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

    async jwt({ token, user }) {
      // user is only defined on the initial sign-in call
      if (user) {
        const u = user as any
        const steamId = u?.steamId || u?.id || ''
        console.log('[auth] jwt initial sign-in, steamId:', steamId)

        token.steamId = steamId
        token.profileUrl = u?.profileUrl || ''
        token.username = u?.name || ''
        token.avatar_url = u?.image || ''

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
            console.error('[auth] jwt DB exception:', err)
          }
        }
      }

      return token
    },

    async session({ session, token }) {
      console.log('[auth] session callback, steamId:', token.steamId)
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
