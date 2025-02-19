import type { PaystackWebhookHandler } from '../types.js'

import { handleCreatedOrUpdated } from './handleCreatedOrUpdated.js'
import { handleDeleted } from './handleDeleted.js'

export const handleWebhooks: PaystackWebhookHandler = (args) => {
  const { event, payload, pluginConfig } = args

  if (pluginConfig?.logs) {
    payload.logger.info(
      `🪝 Received Paystack '${event.event}' webhook event with ID: '${event.id}'.`,
    )
  }

  // could also traverse into event.data.object.object to get the type, but that seems unreliable
  // use cli: `paystack resources` to see all available resources
  const resourceType = event.event.split('.')[0]
  const method = event.event.split('.').pop() // success, failed, update, create, pending, processed, processing, disable, not_renew, payment_failed, expiring_cards, resolve, remind

  const syncConfig = pluginConfig?.sync?.find((sync) => sync.paystackResourceType === resourceType)

  if (syncConfig) {
    // FIXME: None of these handlers work
    switch (method) {
      case 'created': {
        void handleCreatedOrUpdated({
          ...args,
          pluginConfig,
          resourceType,
          syncConfig,
        })
        break
      }
      case 'deleted': {
        void handleDeleted({
          ...args,
          pluginConfig,
          resourceType,
          syncConfig,
        })
        break
      }
      case 'updated': {
        void handleCreatedOrUpdated({
          ...args,
          pluginConfig,
          resourceType,
          syncConfig,
        })
        break
      }
      default: {
        break
      }
    }
  }
}
