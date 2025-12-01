import styles from './Footer.module.css'
import nckuhs from '../../assets/nckuhs.svg'
import laLogo from '../../assets/LA.JPG'
import companyLogo from '../../assets/company-logo.png'

const FOOTER_ITEMS = [
  {
    label: '主辦單位：',
    logo: {
      src: laLogo,
      alt: '中華民國血脂及動脈硬化學會',
    },
    name: '中華民國血脂及動脈硬化學會',
  },
  {
    label: '協辦單位：',
    logo: {
      src: nckuhs,
      alt: '國立成功大學醫學院附設醫院',
    },
    name: '國立成功大學醫學院附設醫院',
  },
  {
    label: '經費來源：',
    logo: {
      src: laLogo,
      alt: '中華民國血脂及動脈硬化學會',
    },
    name: '中華民國血脂及動脈硬化學會',
  },
  // {
  //   label: 'Powered by:',
  //   logo: {
  //     src: companyLogo,
  //     alt: 'Commjat Co., Ltd. 的標誌',
  //   },
  //   // name: 'Commjat Co., Ltd.',
  // }
]

export const Footer = () => (
  <footer className={styles.footer}>
    <div className={styles.content}>
      {FOOTER_ITEMS.map(({ label, logo, name }) => {
        const isPoweredBy = label === 'Powered by:'
        const itemClassName = [styles.item, isPoweredBy ? styles.poweredByItem : '']
          .filter(Boolean)
          .join(' ')
        const logoClassName = [styles.logo, isPoweredBy ? styles.poweredByLogo : '']
          .filter(Boolean)
          .join(' ')
        return (
          <div key={label} className={itemClassName}>
            <span className={styles.label}>{label}</span>
            <img className={logoClassName} src={logo.src} alt={logo.alt} />
            <span className={styles.name}>{name}</span>
          </div>
        )
      })}
    </div>
  </footer>
)
