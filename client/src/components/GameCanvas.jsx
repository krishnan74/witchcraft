import { forwardRef } from 'react'

const GameCanvas = forwardRef((props, ref) => {
  return <canvas ref={ref} {...props} />
})

GameCanvas.displayName = 'GameCanvas'

export default GameCanvas

