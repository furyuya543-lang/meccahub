import { NextAuthOptions } from 'next-auth'
import { createServiceClient } from './supabase'

// Steam OpenID provider (custom)
const STEAM_OPENID_URL = 'https://steamcommunity.com/openid'

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: 'steam',
      name: 'Steam',
      type: 'oauth',
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
      const steamProfile = profile as { id?: string; steamId?: string; name?: string; image?: string; profileUrl?: string } | undefined
      const steamId = steamProfile?.steamId || steamProfile?.id || user.id
      if (!steamId) return false

      try {
        const supabase = createServiceClient()
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('steam_id', steamId)
          .single()

        if (!existing) {
          await supabase.from('users').insert({
            steam_id: steamId,
            username: user.name || 'Unknown',
            avatar_url: user.image || '',
            steam_profile_url: steamProfile?.profileUrl || '',
            reputation: 0,
          })
        } else {
          await supabase
            .from('users')
            .update({
              username: user.name || 'Unknown',
              avatar_url: user.image || '',
            })
            .eq('steam_id', steamId)
        }
      } catch {
        return false
      }
      return true
    },
    async jwt({ token, user, profile }) {
      const steamProfile = profile as { steamId?: string; id?: string; profileUrl?: string } | undefined
      if (user) {
        token.steamId = steamProfile?.steamId || steamProfile?.id || user.id
        token.profileUrl = steamProfile?.profileUrl || ''
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as typeof session.user & { steamId: string; profileUrl: string }).steamId = token.steamId as string
        ;(session.user as typeof session.user & { steamId: string; profileUrl: string }).profileUrl = token.profileUrl as string
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
