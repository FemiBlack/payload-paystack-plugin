import type { Config as PayloadConfig, PayloadRequest } from 'payload'

import crypto from 'node:crypto'
import { Paystack } from 'paystack-sdk'

import type { PaystackEvent, PaystackPluginConfig } from '../types.js'

import { handleWebhooks } from '../webhooks/index.js'

export const paystackWebhooks = async (args: {
  config: PayloadConfig
  pluginConfig: PaystackPluginConfig
  req: PayloadRequest
}) => {
  const { config, pluginConfig, req } = args
  let returnStatus = 200

  const { paystackSecretKey, paystackWebhooksEndpointSecret, webhooks } = pluginConfig

  if (paystackWebhooksEndpointSecret) {
    const paystack = new Paystack(paystackSecretKey)

    const body = await req.text?.()
    const paystackSignature = req.headers.get('x-paystack-signature')

    if (paystackSignature && body) {
      let event: PaystackEvent | undefined

      try {
        const hash = crypto
          .createHmac('sha512', paystackWebhooksEndpointSecret)
          .update(body)
          .digest('hex')

        if (hash !== paystackSignature) {
          throw new Error('Invalid signature')
        }
        event = {
          id: paystackSignature,
          ...JSON.parse(body),
        }
      } catch (err: unknown) {
        const msg: string = err instanceof Error ? err.message : JSON.stringify(err)
        req.payload.logger.error(`Error constructing Paystack event: ${msg}`)
        returnStatus = 400
      }

      if (event) {
        await handleWebhooks({
          config,
          event,
          payload: req.payload,
          paystack,
          pluginConfig,
          req,
        })

        // Fire external webhook handlers if they exist
        if (typeof webhooks === 'function') {
          await webhooks({
            config,
            event,
            payload: req.payload,
            paystack,
            pluginConfig,
            req,
          })
        }

        if (typeof webhooks === 'object') {
          const webhookEventHandler = webhooks[event.event]
          if (typeof webhookEventHandler === 'function') {
            await webhookEventHandler({
              config,
              event,
              payload: req.payload,
              paystack,
              pluginConfig,
              req,
            })
          }
        }
      }
    }
  }

  return Response.json(
    { received: true },
    {
      status: returnStatus,
    },
  )
}
