import { v4 as uuid } from 'uuid'

import type { PaystackWebhookHandler, SanitizedPaystackPluginConfig } from '../types.js'

import { deepen } from '../utilities/deepen.js'

type HandleCreatedOrUpdated = (
  args: {
    resourceType: string
    syncConfig: SanitizedPaystackPluginConfig['sync'][0]
  } & Parameters<PaystackWebhookHandler>[0],
) => Promise<void>

export const handleCreatedOrUpdated: HandleCreatedOrUpdated = async (args) => {
  const { config: payloadConfig, event, payload, pluginConfig, resourceType, syncConfig } = args

  const { logs } = pluginConfig || {}

  const paystackDoc: any = event?.data || {}

  const { id: paystackID, object: eventObject } = paystackDoc

  // NOTE: the Paystack API does not nest fields, everything is an object at the top level
  // if the event object and resource type don't match, this change was not top-level
  const isNestedChange = eventObject !== resourceType

  // let paystackID = docID;
  // if (isNestedChange) {
  //   const parentResource = paystackDoc[resourceType];
  //   paystackID = parentResource;
  // }

  if (isNestedChange) {
    if (logs) {
      payload.logger.info(
        `- This change occurred on a nested field of ${resourceType}. Nested fields are not yet supported in auto-sync but can be manually setup.`,
      )
    }
  }

  if (!isNestedChange) {
    if (logs) {
      payload.logger.info(
        `- A new document was created or updated in Paystack, now syncing to Payload...`,
      )
    }

    const collectionSlug = syncConfig?.collection

    const isAuthCollection = Boolean(
      payloadConfig?.collections?.find((collection) => collection.slug === collectionSlug)?.auth,
    )

    // First, search for an existing document in Payload
    const payloadQuery = await payload.find({
      collection: collectionSlug,
      where: {
        paystackID: {
          equals: paystackID,
        },
      },
    })

    const foundDoc = payloadQuery.docs[0] as any

    // combine all properties of the Paystack doc and match their respective fields within the document
    let syncedData = syncConfig.fields.reduce(
      (acc, field) => {
        const { fieldPath, paystackProperty } = field

        acc[fieldPath] = paystackDoc[paystackProperty]
        return acc
      },
      {} as Record<string, any>,
    )

    syncedData = deepen({
      ...syncedData,
      paystackID,
      skipSync: true,
    })

    if (!foundDoc) {
      if (logs) {
        payload.logger.info(
          `- No existing '${collectionSlug}' document found with Paystack ID: '${paystackID}', creating new...`,
        )
      }

      // auth docs must use unique emails
      let authDoc = null

      if (isAuthCollection) {
        try {
          if (paystackDoc?.email) {
            const authQuery = await payload.find({
              collection: collectionSlug,
              where: {
                email: {
                  equals: paystackDoc.email,
                },
              },
            })

            authDoc = authQuery.docs[0] as any

            if (authDoc) {
              if (logs) {
                payload.logger.info(
                  `- Account already exists with e-mail: ${paystackDoc.email}, updating now...`,
                )
              }

              // account exists by email, so update it instead
              try {
                await payload.update({
                  id: authDoc.id,
                  collection: collectionSlug,
                  data: syncedData,
                })

                if (logs) {
                  payload.logger.info(
                    `✅ Successfully updated '${collectionSlug}' document in Payload with ID: '${authDoc.id}.'`,
                  )
                }
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : err
                if (logs) {
                  payload.logger.error(
                    `- Error updating existing '${collectionSlug}' document: ${msg}`,
                  )
                }
              }
            }
          } else {
            if (logs) {
              payload.logger.error(
                `No email was provided from Paystack, cannot create new '${collectionSlug}' document.`,
              )
            }
          }
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : error
          if (logs) {
            payload.logger.error(`Error looking up '${collectionSlug}' document in Payload: ${msg}`)
          }
        }
      }

      if (!isAuthCollection || (isAuthCollection && !authDoc)) {
        try {
          if (logs) {
            payload.logger.info(
              `- Creating new '${collectionSlug}' document in Payload with Paystack ID: '${paystackID}'.`,
            )
          }

          // generate a strong, unique password for the new user
          const password: string = uuid()

          await payload.create({
            collection: collectionSlug,
            data: {
              ...syncedData,
              password,
              passwordConfirm: password,
            },
            disableVerificationEmail: isAuthCollection ? true : undefined,
          })

          if (logs) {
            payload.logger.info(
              `✅ Successfully created new '${collectionSlug}' document in Payload with Paystack ID: '${paystackID}'.`,
            )
          }
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : error
          if (logs) {
            payload.logger.error(`Error creating new document in Payload: ${msg}`)
          }
        }
      }
    } else {
      if (logs) {
        payload.logger.info(
          `- Existing '${collectionSlug}' document found in Payload with Paystack ID: '${paystackID}', updating now...`,
        )
      }

      try {
        await payload.update({
          id: foundDoc.id,
          collection: collectionSlug,
          data: syncedData,
        })

        if (logs) {
          payload.logger.info(
            `✅ Successfully updated '${collectionSlug}' document in Payload from Paystack ID: '${paystackID}'.`,
          )
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : error
        if (logs) {
          payload.logger.error(`Error updating '${collectionSlug}' document in Payload: ${msg}`)
        }
      }
    }
  }
}
