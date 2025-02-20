import type { CollectionSlug, Payload, Config as PayloadConfig, PayloadRequest } from 'payload'
import type { Paystack } from 'paystack-sdk'

type PaystackEventData = { [x: string]: any } | { [x: string]: any }[]

export type PaystackWebhookHandler<T extends PaystackEventData = any> = (args: {
  config: PayloadConfig
  event: PaystackEvent<T>
  payload: Payload
  paystack: Paystack
  pluginConfig?: PaystackPluginConfig
  req: PayloadRequest
}) => Promise<void> | void

export type PaystackWebhookHandlers = {
  [webhookName: string]: PaystackWebhookHandler
}

export type FieldSyncConfig = {
  fieldPath: string
  paystackProperty: string
}

export type SyncConfig = {
  collection: CollectionSlug
  fields: FieldSyncConfig[]
  paystackResourceType: Omit<keyof Paystack, 'http' | 'key'> // TODO: get this from Paystack types
  //   paystackResourceTypeSingular: 'customer' | 'product' // TODO: there must be a better way to do this
}

export type PaystackPluginConfig = {
  disabled?: boolean
  logs?: boolean
  paystackSecretKey: string
  paystackWebhooksEndpointSecret?: string
  /** @default false */
  rest?: boolean
  sync?: SyncConfig[]
  webhooks?: PaystackWebhookHandler | PaystackWebhookHandlers
}

export type SanitizedPaystackPluginConfig = {
  sync: SyncConfig[] // convert to required
} & PaystackPluginConfig

export type PaystackProxy = (args: {
  paystackArgs: any[]
  paystackMethod: string
  paystackSecretKey: string
}) => Promise<{
  data?: any
  message?: string
  status: number
}>

export type PaystackEvent<T extends object = object> = {
  data: T
  /**
   * The type of the event. For example, `subscription.create`, `charge.success`, etc.
   */
  event: string
  /**
   * The unique identifier for the event. This is the same as `x-paystack-signature` header.
   */
  id: string
}
