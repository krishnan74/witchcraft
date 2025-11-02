import { useEffect, useState } from 'react'
import './NightBeginsPopup.css'

/**
 * Night Begins Popup Component
 * Shows when night time starts automatically
 */
export default function NightBeginsPopup({ isOpen, onClose, currentDay }) {
  const [shouldClose, setShouldClose] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Auto-close after 3 seconds
      const timer = setTimeout(() => {
        setShouldClose(true)
        setTimeout(() => {
          onClose()
          setShouldClose(false)
        }, 300) // Wait for fade-out animation
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])

  // Close on Escape key or click
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShouldClose(true)
        setTimeout(() => {
          onClose()
          setShouldClose(false)
        }, 300)
      }
    }

    const handleClick = () => {
      setShouldClose(true)
      setTimeout(() => {
        onClose()
        setShouldClose(false)
      }, 300)
    }

    window.addEventListener('keydown', handleEscape)
    window.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('keydown', handleEscape)
      window.removeEventListener('click', handleClick)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      className={`night-begins-overlay ${shouldClose ? 'closing' : ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={`night-begins-popup ${shouldClose ? 'closing' : ''}`}>
        <div className="night-icon">🌙</div>
        <h2>Night Has Begun!</h2>
        <p className="night-message">
          Day {currentDay} - Night Phase
        </p>
        <p className="night-hint">
          Go to the Shop to sell your potions!
        </p>
        <div className="auto-close-hint">
          Closing automatically in a few seconds...
        </div>
      </div>
    </div>
  )
}

