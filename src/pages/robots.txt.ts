import type {APIRoute} from 'astro'
import {buildRobotsText} from '../lib/static-routes'

export const GET: APIRoute = ({site}) => {
  const origin = site ?? new URL('https://florianlepont.github.io')
  return new Response(buildRobotsText(origin, import.meta.env.BASE_URL), {
    headers: {'Content-Type': 'text/plain; charset=utf-8'},
  })
}
