import styles from './Layout.module.css'
import { Sidebar } from './Sidebar.jsx'
import { MobileStepper } from './MobileStepper.jsx'
import { MainContent } from './MainContent.jsx'
import { Footer } from './Footer.jsx'

export const Layout = ({ children }) => (
  <div className={styles.appShell}>
    <Sidebar />
    <MainContent>
      <MobileStepper />
      <div className={styles.contentArea}>{children}</div>
      <Footer />
    </MainContent>
  </div>
)
