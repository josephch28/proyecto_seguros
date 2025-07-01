import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const ContractDetails = ({ contract, onClose }) => {
    const [seguro, setSeguro] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchSeguro = async () => {
            if (!contract.seguro_id) {
                setError('No se encontró el ID del seguro');
                setLoading(false);
                return;
            }

            try {
                console.log('Obteniendo detalles del seguro:', contract.seguro_id);
                const response = await axios.get(`${API_URL}/seguros/${contract.seguro_id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                console.log('Respuesta del servidor:', response.data);
                
                if (response.data.success && response.data.data) {
                    const seguroData = response.data.data;
                    console.log('Datos del seguro obtenidos:', seguroData);
                    setSeguro(seguroData);
                } else {
                    console.error('Error en la respuesta del servidor:', response.data);
                    setError('No se pudo obtener la información del seguro');
                }
            } catch (error) {
                console.error('Error al obtener detalles del seguro:', error);
                setError('Error al cargar los detalles del seguro');
            } finally {
                setLoading(false);
            }
        };

        fetchSeguro();
    }, [contract.seguro_id, token]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        if (!amount) return '0,00 €';
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    const getTipoSeguroText = (tipo) => {
        if (!tipo) return 'No especificado';
        return tipo === 'medico' ? 'Salud' : 'Vida';
    };

    const getCoberturaText = (seguro) => {
        if (!seguro || !seguro.cobertura) return 'No especificada';
        
        const cobertura = parseFloat(seguro.cobertura);
        if (isNaN(cobertura)) return 'No especificada';

        if (seguro.tipo === 'medico') {
            return `${cobertura}% de cobertura médica`;
        } else {
            return `${formatCurrency(cobertura)} en caso de fallecimiento`;
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
                    <div className="text-red-500 text-center">{error}</div>
                    <button
                        onClick={onClose}
                        className="mt-4 w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
                <h2 className="text-2xl font-bold mb-6">Detalles del Contrato</h2>
                
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-lg mb-2">Información del Seguro</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            {seguro ? (
                                <>
                                    <p className="mb-2"><span className="font-semibold">Nombre:</span> {seguro.nombre || 'No especificado'}</p>
                                    <p className="mb-2"><span className="font-semibold">Tipo:</span> {getTipoSeguroText(seguro.tipo)}</p>
                                    <p className="mb-2"><span className="font-semibold">Cobertura:</span> {getCoberturaText(seguro)}</p>
                                    <p className="mb-2"><span className="font-semibold">Precio Base:</span> {formatCurrency(seguro.precio_base)}</p>
                                    <p className="mb-2"><span className="font-semibold">Beneficios:</span></p>
                                    <p className="text-gray-600 whitespace-pre-line">{seguro.beneficios || 'No especificados'}</p>
                                    <p className="mt-2 mb-2"><span className="font-semibold">Requisitos:</span></p>
                                    <p className="text-gray-600 whitespace-pre-line">{seguro.requisitos || 'No especificados'}</p>
                                </>
                            ) : (
                                <p className="text-red-500">No se encontró información del seguro</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-lg mb-2">Información del Contrato</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="mb-2"><span className="font-semibold">Fecha de Inicio:</span> {formatDate(contract.fecha_inicio)}</p>
                            <p className="mb-2"><span className="font-semibold">Fecha de Fin:</span> {formatDate(contract.fecha_fin)}</p>
                            <p className="mb-2"><span className="font-semibold">Estado:</span> {contract.estado}</p>
                            <p className="mb-2"><span className="font-semibold">Precio Total:</span> {formatCurrency(contract.precio_total)}</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="mt-6 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
};

export default ContractDetails; 