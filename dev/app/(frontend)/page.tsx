'use client'

export default function Page() {
  return (
    <button
      onClick={async () => {
        const { default: PaystackPop } = await import('@paystack/inline-js')
        const paystackInstance = new PaystackPop()

        paystackInstance.newTransaction({
          amount: 1000000,
          email: 'test@gmail.com',
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
        })
      }}
      type="button"
    >
      charge
    </button>
  )
}
