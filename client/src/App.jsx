// App.jsx

import './App.css';
import { createBrowserRouter, RouterProvider ,Link} from 'react-router-dom';
import HomePage from './pages/home/HomePage';
import JoinPage from './pages/join/JoinPage';
import AppContextProvider from './store/app-context';
import { AppContext } from './store/app-context';
import { useContext } from 'react';
import Cookies from 'js-cookie';
function App() {
  
  const  SecureJoin  = ()=> {
    const {userData,roomId} = useContext(AppContext);
      return ( userData && roomId.length > 0  ) ? <JoinPage/> : (
        <>
           <div>
            <h2>
               You are not signIn , please sign in go , to <Link to='/'>Home</Link>
            </h2>
           </div>
        </>
      ) ;
  }; 

  const router = createBrowserRouter([
    {
      path: '/',
      element: <HomePage />
    }, {
      path: 'join',
      element: <SecureJoin/>,
    },
  ]);

  return (
     <AppContextProvider>
       <RouterProvider router={router} />
     </AppContextProvider>
   
  )
}

export default App
