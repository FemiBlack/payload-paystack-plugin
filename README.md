# Payload Paystack Plugin

This plugin allows you to listen for Paystack webhooks ~~and sync your Paystack resources to your Payload resources.~~

## Installation

```bash
pnpm add paystack-plugin-paystack 
```

## Configuration

Add the following to your `payload.config.ts` file:

```ts
import { payloadPaystackPlugin } from 'paystack-plugin-paystack'

export default payload({
  plugins: [
    payloadPaystackPlugin({
      paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || '',
      paystackWebhooksEndpointSecret: process.env.PAYSTACK_WEBHOOKS_ENDPOINT_SECRET || '',
      webhooks: {
        'charge.success': ({ event, payload }) => {
          payload.logger.info(event)
        },
      },
    }),
  ],
})
```

## Usage

### Webhooks

The plugin will automatically listen for webhooks from Paystack and handle them accordingly. You can also define custom webhook handlers by passing an object to the `webhooks` option in the plugin configuration.

For example, if you want to handle the `charge.success` event, you can add the following to your `payload.config.ts` file:

```ts
import { payloadPaystackPlugin } from 'paystack-plugin-paystack'

export default payload({
  plugins: [
    payloadPaystackPlugin({
      paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || '',
      paystackWebhooksEndpointSecret: process.env.PAYSTACK_WEBHOOKS_ENDPOINT_SECRET || '',
      webhooks: {
        'charge.success': ({ event, payload }) => {
          payload.logger.info(event)
        },
      },
    }),
  ],
})
```

### Syncing Paystack resources to Payload resources

**Work In Progress**. ~~The plugin will automatically sync Paystack resources to Payload resources.~~