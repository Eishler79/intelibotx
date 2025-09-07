import { useState } from 'react';

const useExchangeModalState = () => {
  const [loading, setLoading] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState('');
  const [formData, setFormData] = useState({
    connection_name: '',
    api_key: '',
    api_secret: '',
    passphrase: '',
    is_testnet: true
  });
  const [error, setError] = useState('');

  const handleExchangeSelect = (exchangeName) => {
    setSelectedExchange(exchangeName);
    setFormData(prev => ({
      ...prev,
      connection_name: prev.connection_name || `Mi ${exchangeName.charAt(0).toUpperCase() + exchangeName.slice(1)}`
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setSelectedExchange('');
    setFormData({
      connection_name: '',
      api_key: '',
      api_secret: '',
      passphrase: '',
      is_testnet: true
    });
    setError('');
  };

  return {
    loading,
    setLoading,
    selectedExchange,
    formData,
    error,
    setError,
    handleExchangeSelect,
    handleInputChange,
    resetForm
  };
};

export default useExchangeModalState;