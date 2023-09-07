const ErrorFallback = () => {
  return (
    <div className="hero min-h-screen bg-teal-400">
      <div className="hero-content text-center rounded-lg p-6 max-w-md bg-white mx-auto">
        <div className="max-w-md">
          <h1 className="text-4xl">Error occured</h1>
          <p className="py-6">
            Please make sure to set up your environment variables correctly. Create a .env file based on .env.template and fill in the
            required values. This controls the network and credentials for connections with Algod and Indexer.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ErrorFallback
