import { useState, useEffect } from 'react'
import Controller from '@cartridge/controller'
import { useContext } from 'react'
import { DojoContext } from '@dojoengine/sdk/react'

export default function WalletConnect({ controller }) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)
  const [connectedAccount, setConnectedAccount] = useState(null)

  const dojoContext = useContext(DojoContext)
  const dojoAccount = dojoContext?.account
  
  // Use controller from props or window global
  const cartController = controller || window.cartridgeController

  // Check if there's an existing connection
  useEffect(() => {
    if (cartController && cartController.isConnected && cartController.account) {
      setConnectedAccount(cartController.account)
    }
  }, [cartController])

  const handleConnect = async () => {
    if (!cartController) {
      setError('Controller not initialized')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      const account = await cartController.connect()
      console.log('Wallet connected:', account.address)
      setConnectedAccount(account)
      
      // Update SDK with new account
      if (dojoContext?.sdk && account) {
        dojoContext.sdk.account = account
        console.log('SDK account updated to:', account.address)
        
        // Force SDK to recognize the account - trigger a refresh if possible
        // The useDojoHook will pick this up via its polling mechanism
      }
      
      // Trigger a small delay to ensure state updates propagate
      setTimeout(() => {
        window.dispatchEvent(new Event('controller-account-changed'))
      }, 100)
    } catch (err) {
      console.error('Connection error:', err)
      setError(err.message || 'Failed to connect wallet')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!cartController) return
    
    try {
      await cartController.disconnect()
      setConnectedAccount(null)
      if (dojoContext?.sdk) {
        dojoContext.sdk.account = null
      }
    } catch (err) {
      console.error('Disconnect error:', err)
      setError(err.message || 'Failed to disconnect')
    }
  }

  // Use connected account or Dojo context account
  const currentAccount = connectedAccount || dojoAccount
  const accountAddress = currentAccount?.address
  const isConnected = !!currentAccount && !!accountAddress

  if (isConnected && accountAddress) {
    return (
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#f0f9ff',
        border: '1px solid #0ea5e9',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <div style={{ fontWeight: 'bold', color: '#0369a1', marginBottom: '4px' }}>
              Wallet Connected
            </div>
            <div style={{ 
              color: '#0284c7', 
              fontSize: '12px',
              wordBreak: 'break-all',
              fontFamily: 'monospace'
            }}>
              {accountAddress.slice(0, 6)}...{accountAddress.slice(-4)}
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            style={{
              padding: '6px 12px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            Disconnect
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      padding: '12px 16px',
      backgroundColor: '#fef3c7',
      border: '1px solid #f59e0b',
      borderRadius: '8px'
    }}>
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontWeight: 'bold', color: '#92400e', marginBottom: '4px' }}>
          Wallet Not Connected
        </div>
        <div style={{ fontSize: '12px', color: '#78350f' }}>
          Connect your Cartridge Controller wallet to interact with the game
        </div>
      </div>
      <button
        onClick={handleConnect}
        disabled={isConnecting || !cartController}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: isConnecting ? '#d1d5db' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: isConnecting ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
      {error && (
        <div style={{
          marginTop: '8px',
          padding: '8px',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          {error}
        </div>
      )}
    </div>
  )
}

