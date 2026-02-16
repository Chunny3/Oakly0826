'use client'
import styles from '@/styles/_components/button.module.css'

export default function ButtonGroup({ children }) {

  
  return (
    <div className={styles.btnGroup}>
      {children}
    </div>
  )
}