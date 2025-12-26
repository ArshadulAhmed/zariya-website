import React from 'react'
import Header from '../components/Header'
import Hero from '../components/Hero'
import About from '../components/About'
import Services from '../components/Services'
import Features from '../components/Features'
import Process from '../components/Process'
import Contact from '../components/Contact'
import Footer from '../components/Footer'
import '../styles/App.scss'

const Home = () => {
  return (
    <div className="app">
      <Header />
      <Hero />
      <About />
      <Services />
      <Features />
      <Process />
      <Contact />
      <Footer />
    </div>
  )
}

export default Home

