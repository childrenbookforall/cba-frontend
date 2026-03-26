import { useEffect, useState } from 'react'

/**
 * Returns true when the on-screen keyboard is open.
 * Uses the Visual Viewport API: keyboard open ≈ visual height < layout height by >100px.
 * Works on Android Chrome; iOS Safari also fires visualViewport resize events.
 */
export function useKeyboardVisible() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    function update() {
      setVisible(window.innerHeight - vv!.height > 100)
    }

    vv.addEventListener('resize', update)
    return () => vv.removeEventListener('resize', update)
  }, [])

  return visible
}
