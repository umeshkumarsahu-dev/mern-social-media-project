// components/Loader.js
import { Oval } from 'react-loader-spinner';

const Loader = () => {
  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Oval
        height={80}
        width={80}
        color="#4fa94d"
        visible={true}
        ariaLabel="oval-loading"
        secondaryColor="#4fa94d"
        strokeWidth={2} 
        strokeWidthSecondary={2}
      />
    </div>
  );
};

export default Loader;
