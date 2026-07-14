// Push notification handler for Atlas PWA
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Atlas", {
      body: data.body ?? "Time to check your habits!",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      tag: data.tag ?? "atlas-notification",
      data: { url: data.url ?? "/habits" },
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? "/"
  const isExternal = /^https?:\/\//i.test(url) && !url.startsWith(self.location.origin)

  event.waitUntil(
    (async () => {
      // External URLs always open in a new window; navigate() only works same-origin.
      if (isExternal) {
        await self.clients.openWindow(url)
        return
      }

      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          await client.navigate(url)
          await client.focus()
          return
        }
      }
      await self.clients.openWindow(url)
    })()
  )
})
