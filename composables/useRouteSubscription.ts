type RouteSubscriptionRow = {
  id: string
  originAirport: string
  destAirport: string
  enabled: boolean
}

function normalizeAirport(code: string): string {
  return code.trim().toUpperCase()
}

export function useRouteSubscription() {
  async function getRouteSubscription(originAirport: string, destAirport: string): Promise<RouteSubscriptionRow | null> {
    const origin = normalizeAirport(originAirport)
    const dest = normalizeAirport(destAirport)
    if (!origin || !dest) return null

    const res = await $fetch<{ subscriptions: RouteSubscriptionRow[] }>('/api/route-subscriptions', {
      query: { originAirport: origin, destAirport: dest },
    })
    return res.subscriptions[0] ?? null
  }

  async function upsertRouteSubscription(originAirport: string, destAirport: string, enabled = true): Promise<RouteSubscriptionRow> {
    const origin = normalizeAirport(originAirport)
    const dest = normalizeAirport(destAirport)
    const res = await $fetch<{ subscription: RouteSubscriptionRow }>('/api/route-subscriptions', {
      method: 'POST',
      body: { originAirport: origin, destAirport: dest, enabled },
    })
    return res.subscription
  }

  async function setRouteSubscriptionEnabled(id: string, enabled: boolean): Promise<RouteSubscriptionRow> {
    const res = await $fetch<{ subscription: RouteSubscriptionRow }>(`/api/route-subscriptions/${id}`, {
      method: 'PATCH',
      body: { enabled },
    })
    return res.subscription
  }

  return {
    getRouteSubscription,
    upsertRouteSubscription,
    setRouteSubscriptionEnabled,
  }
}
