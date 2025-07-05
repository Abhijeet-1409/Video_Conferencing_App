// App.jsx

import './App.css';
import { createBrowserRouter, RouterProvider ,Link} from 'react-router-dom';
import HomePage from './pages/home/HomePage';
import JoinPage from './pages/join/JoinPage';
import AccessDeniedPage from './pages/error/AccessDeniedPage';
import AppContextProvider from './store/app-context';
import { AppContext } from './store/app-context';
import { useContext } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = import.meta.env.VITE_CLIENT_ID;

function App() {

  const  SecureJoin  = ()=> {
    const {userData,roomId} = useContext(AppContext);
      return ( userData && roomId.length > 0  ) ? <JoinPage/> : <AccessDeniedPage/> ;
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
     <GoogleOAuthProvider clientId={clientId}>
     <AppContextProvider>
       <RouterProvider router={router} />
     </AppContextProvider>
     </GoogleOAuthProvider>

  )
}

export default App
