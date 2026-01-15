import styles from './Footer.module.css'
import nckuhs from '../../assets/nckuhs.svg'
import laLogo from '../../assets/LA.JPG'
import wflogo from '../../assets/logo.png'
import { useLanguage } from '../../context/LanguageContext.jsx'

export const Footer = () => {
  const { dictionary } = useLanguage()
  const t = dictionary.footer

  const FOOTER_ITEMS = [
    {
      label: t.organizer,
      logo: {
        src: laLogo,
        alt: t.organizerName,
      },
      name: t.organizerName,
    },
    {
      label: t.coOrganizer,
      logo: {
        src: nckuhs,
        alt: t.coOrganizerName,
      },
      name: t.coOrganizerName,
    },
    {
      label: t.fundingSource,
      logo: {
        src: wflogo,
        alt: t.fundingSourceName,
      },
      name: t.fundingSourceName,
    },
  ]

  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        {FOOTER_ITEMS.map(({ label, logo, name }) => (
          <div key={label} className={styles.item}>
            <span className={styles.label}>{label}</span>
            <img className={styles.logo} src={logo.src} alt={logo.alt} />
            <span className={styles.name}>{name}</span>
          </div>
        ))}
      </div>
    </footer>
  )
}

