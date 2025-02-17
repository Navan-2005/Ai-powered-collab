import React from 'react'
import { BrowserRouter,Route, Routes } from 'react-router-dom'
import Login from '../screens/Login'
import Register from '../screens/Register'
import Home from '../screens/Home'
import Project from '../screens/Project'
// import Project1 from '../screens/Project2'
import Wrapper from '../screens/Wrapper'

 const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Wrapper><Home /></Wrapper>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/project" element={<Wrapper><Project/></Wrapper>} />

      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
