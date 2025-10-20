import styles from './Button.module.css'

export const Button = ({ variant = 'primary', type = 'button', children, ...props }) => (
  <button
    type={type}
    className={`${styles.button} ${styles[variant] ?? ''}`}
    {...props}
  >
    {children}
  </button>
)
