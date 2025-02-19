import type { Config, Endpoint } from 'payload'

import type { PaystackPluginConfig, SanitizedPaystackPluginConfig } from './types.js'

import { paystackWebhooks } from './routes/webhooks.js'

export const payloadPaystackPlugin =
  (pluginOptions: PaystackPluginConfig) =>
  (config: Config): Config => {
    const pluginConfig: SanitizedPaystackPluginConfig = {
      ...pluginOptions,
      rest: pluginOptions?.rest ?? false,
      sync: pluginOptions?.sync || [],
    }

    const endpoints: Endpoint[] = [
      ...(config?.endpoints || []),
      {
        handler: async (req) => {
          const res = await paystackWebhooks({
            config,
            pluginConfig,
            req,
          })

          return res
        },
        method: 'post',
        path: '/paystack/webhooks',
      },
    ]
    /**
     * If the plugin is disabled, we still want to keep added collections/fields so the database schema is consistent which is important for migrations.
     * If your plugin heavily modifies the database schema, you may want to remove this property.
     */
    // if (pluginOptions.disabled) {
    //   return config
    // }

    config.endpoints = endpoints

    return config
  }
