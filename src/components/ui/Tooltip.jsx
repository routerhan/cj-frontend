import { useId, useState } from 'react'
import styles from './Tooltip.module.css'

export const Tooltip = ({ label, triggerLabel = '更多資訊', icon = 'i', children }) => {
  const [isVisible, setIsVisible] = useState(false)
  const tooltipId = useId()

  const show = () => setIsVisible(true)
  const hide = () => setIsVisible(false)

  return (
    <span className={styles.wrapper}>
      <button
        type="button"
        className={styles.trigger}
        aria-describedby={tooltipId}
        aria-label={triggerLabel}
        title={triggerLabel}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {icon}
      </button>
      <span role="tooltip" id={tooltipId} className={styles.tooltip} data-visible={isVisible}>
        {label}
      </span>
      {children}
    </span>
  )
}
