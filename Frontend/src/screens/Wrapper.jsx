import  {  useEffect  } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
 const Wrapper = ({children}) => {
    const token = localStorage.getItem('token')
    const navigate = useNavigate()
    useEffect(() => {
     if(!token)  
        {
            navigate('/login');
            return;
        }

    },[token,navigate])
    

  return (
    <>
       {children}
    </>
  )
}

Wrapper.propTypes = {
    children: PropTypes.node.isRequired
}
export default Wrapper;