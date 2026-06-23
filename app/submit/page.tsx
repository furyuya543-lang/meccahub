import { SubmitForm } from './SubmitForm'

export const metadata = {
  title: 'Submit a Hide — MeccaHub',
  description: 'Submit your best hide spot for Meccha Chameleon to the MeccaHub community.',
}

export default function SubmitPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Submit a Hide</h1>
        <p className="text-gray-400">Share your best hiding spot with the community. You must be signed in with Steam.</p>
      </div>
      <SubmitForm />
    </div>
  )
}
