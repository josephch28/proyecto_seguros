import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Autocomplete,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Container,
  CircularProgress,
  Chip,
  ListItemIcon
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Upload as UploadIcon, Download as DownloadIcon, Restore as RestoreIcon, Check as CheckIcon, Close as CloseIcon, Add as AddIcon, Visibility as VisibilityIcon, CheckCircle as CheckCircleIcon, Info as InfoIcon } from '@mui/icons-material';
import axios from 'axios';
import SignaturePad from 'react-signature-canvas';
import { useNavigate } from 'react-router-dom';

// Configuración de la API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const ContractManagement = () => {
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [insurances, setInsurances] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [signaturePad, setSignaturePad] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState(null);
  const [clientDocuments, setClientDocuments] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [formData, setFormData] = useState({
    cliente_id: '',
    seguro_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    monto_prima: '',
    estado: 'pendiente',
    forma_pago: 'efectivo',
    frecuencia_pago: 'mensual',
    monto_pago: '',
    banco: '',
    numero_cuenta: '',
    tipo_cuenta: ''
  });
  const [signature, setSignature] = useState(null);
  const [selectedInsuranceDetails, setSelectedInsuranceDetails] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      setUserRole(decodedToken.rol);
      setUserId(decodedToken.id);
    }
    console.log('Iniciando carga de datos...');
    fetchContracts();
    fetchClients();
    fetchInsurances();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      const userId = decodedToken.id;
      const userRole = decodedToken.rol;

      let url = '/api/contratos';
      if (userRole === 'cliente') {
        url = '/api/contratos/mis-contratos';
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Respuesta del servidor:', response.data);
      if (response.data.success) {
        setContracts(response.data.data);
      } else {
        setError('Error al cargar los contratos: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error al cargar contratos:', error);
      setError('Error al cargar los contratos: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Cambiado a la URL correcta para clientes
      const response = await axios.get('/api/users/clientes', { headers });
      console.log('Respuesta completa de clientes:', response);
      console.log('Datos de clientes:', response.data);

      // Verificar la estructura de la respuesta
      if (response.data) {
        let clientsData;
        if (response.data.success && response.data.data) {
          clientsData = response.data.data;
        } else if (response.data.data) {
          clientsData = response.data.data;
        } else if (Array.isArray(response.data)) {
          clientsData = response.data;
        } else {
          clientsData = [];
        }

        // Verificar que clientsData sea un array
        if (!Array.isArray(clientsData)) {
          console.error('Los datos de clientes no son un array:', clientsData);
          clientsData = [];
        }

        console.log('Clientes a guardar:', clientsData);
        setClients(clientsData);
      } else {
        console.error('Respuesta sin datos:', response);
        setError('Error al cargar los clientes: No hay datos disponibles');
        setClients([]);
      }
    } catch (error) {
      console.error('Error completo al cargar clientes:', error);
      console.error('Detalles del error:', error.response?.data);
      setError(error.response?.data?.message || 'Error al cargar los clientes');
      setClients([]);
    }
  };

  const fetchInsurances = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/seguros', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInsurances(response.data);
    } catch (error) {
      setError('Error al cargar los seguros');
    }
  };

  // Función para procesar los beneficiarios
  const processBeneficiaries = (beneficiarios) => {
    if (!beneficiarios) return [];
    if (Array.isArray(beneficiarios)) return beneficiarios;
    try {
      // Si es un string, intentar parsearlo
      const parsed = JSON.parse(beneficiarios);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error al procesar beneficiarios:', error);
      return [];
    }
  };

  // Función para cargar los detalles del contrato
  const handleEdit = async (contract) => {
    console.log('Contrato seleccionado:', contract);
    
    if (contract) {
      // Modo edición
      // Asegurarse de que los beneficiarios sean un array
      const beneficiariosProcesados = processBeneficiaries(contract.beneficiarios);
      console.log('Beneficiarios procesados:', beneficiariosProcesados);

      setSelectedContract({
        ...contract,
        beneficiarios: beneficiariosProcesados
      });

      setFormData({
        cliente_id: contract.cliente_id,
        seguro_id: contract.seguro_id,
        fecha_inicio: contract.fecha_inicio,
        fecha_fin: contract.fecha_fin,
        monto_prima: contract.monto_prima,
        estado: contract.estado,
        forma_pago: contract.forma_pago,
        frecuencia_pago: contract.frecuencia_pago,
        monto_pago: contract.monto_pago,
        numero_cuenta: contract.numero_cuenta || '',
        banco: contract.banco || '',
        tipo_cuenta: contract.tipo_cuenta || ''
      });

      // Cargar beneficiarios
      setBeneficiaries(beneficiariosProcesados);

      // Cargar detalles del seguro
      if (contract.seguro_id) {
        const selectedInsurance = insurances.find(i => i.id === contract.seguro_id);
        if (selectedInsurance) {
          setSelectedInsuranceDetails(selectedInsurance);
        }
      }

      // Cargar firma si existe
      if (contract.firma_cliente) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(
            `${API_URL}/contratos/${contract.id}/firma`,
            {
              headers: { Authorization: `Bearer ${token}` },
              responseType: 'blob'
            }
          );
          const firmaUrl = URL.createObjectURL(response.data);
          setSignature(firmaUrl);
        } catch (error) {
          console.error('Error al cargar la firma:', error);
          setSignature(null);
        }
      } else {
        setSignature(null);
      }
    } else {
      // Modo creación
      setSelectedContract(null);
      setFormData({
        cliente_id: '',
        seguro_id: '',
        fecha_inicio: '',
        fecha_fin: '',
        monto_prima: '',
        estado: 'pendiente',
        forma_pago: 'efectivo',
        frecuencia_pago: 'mensual',
        monto_pago: '',
        banco: '',
        numero_cuenta: '',
        tipo_cuenta: ''
      });
      setBeneficiaries([]);
      setSelectedInsuranceDetails(null);
      setSignature(null);
      if (signaturePad) {
        signaturePad.clear();
      }
    }

    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedContract(null);
    setFormData({
      cliente_id: '',
      seguro_id: '',
      fecha_inicio: '',
      fecha_fin: '',
      monto_prima: '',
      estado: 'pendiente',
      forma_pago: 'efectivo',
      frecuencia_pago: 'mensual',
      monto_pago: '',
      banco: '',
      numero_cuenta: '',
      tipo_cuenta: ''
    });
    setMedicalHistory(null);
    setBeneficiaries([]);
    setSignature(null);
    if (signaturePad) {
      signaturePad.clear();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Campo ${name} cambiado a:`, value);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignatureEnd = () => {
    if (signaturePad) {
      const signatureData = signaturePad.toDataURL('image/png');
      console.log('Firma capturada:', {
        type: signatureData.split(';')[0],
        size: signatureData.length
      });
      setSignature(signatureData);
    }
  };

  const handleRestoreSignature = () => {
    if (signaturePad) {
      signaturePad.clear();
      setSignature(null);
    }
  };

  const handleMedicalHistoryChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setSnackbar({
          open: true,
          message: 'La historia médica debe ser un archivo PDF',
          severity: 'error'
        });
        return;
      }
      setMedicalHistory(file);
      setSnackbar({
        open: true,
        message: 'Archivo seleccionado: ' + file.name,
        severity: 'success'
      });
    }
  };

  const handleAddBeneficiary = () => {
    setBeneficiaries([...beneficiaries, { nombre: '', parentesco: '', fecha_nacimiento: '' }]);
  };

  const handleBeneficiaryChange = (index, field, value) => {
    const newBeneficiaries = [...beneficiaries];
    newBeneficiaries[index] = {
      ...newBeneficiaries[index],
      [field]: value,
      // Si el parentesco no es "otro", limpiar parentesco_otro
      ...(field === 'parentesco' && value !== 'otro' && { parentesco_otro: null })
    };
    setBeneficiaries(newBeneficiaries);
    setFormData(prev => ({
      ...prev,
      beneficiarios: newBeneficiaries
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validar campos requeridos
      if (!formData.seguro_id || !formData.fecha_inicio || !formData.fecha_fin) {
        setError('Todos los campos son requeridos');
        setLoading(false);
        return;
      }

      // Obtener el token del localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay sesión activa. Por favor, inicie sesión.');
        setLoading(false);
        return;
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      let response;
      if (userRole === 'cliente') {
        const data = new FormData();
        data.append('cliente_id', userId);
        Object.entries(formData).forEach(([key, value]) => {
          if (key !== 'cliente_id') data.append(key, value);
        });
        if (medicalHistory) data.append('historia_medica', medicalHistory);
        if (clientDocuments) data.append('documentos_cliente', clientDocuments);
        if (beneficiaries.length > 0) data.append('beneficiarios', JSON.stringify(beneficiaries));
        if (signature) data.append('firma_cliente', signature);
        response = await axios.post(`${API_URL}/contratos`, data, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      } else {
        console.log('Creando nuevo contrato');
        response = await axios.post(
          `${API_URL}/contratos`,
          formData,
          config
        );
      }

      console.log('Respuesta del servidor:', response.data);

      if (response.data.success) {
        setSuccess(selectedContract ? 'Contrato actualizado exitosamente' : 'Contrato creado exitosamente');
        handleCloseDialog();
        fetchContracts();
      } else {
        setError(response.data.message || 'Error al guardar el contrato');
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      setError(error.response?.data?.message || 'Error al guardar el contrato');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contratoId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este contrato?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      const response = await axios.delete(`/api/contratos/${contratoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess(response.data.message);
        fetchContracts();
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error al eliminar contrato:', error);
      setError(error.response?.data?.message || 'Error al eliminar el contrato');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (contratoId, accion) => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      // Solo actualizar el estado del contrato
      const response = await axios.put(
        `${API_URL}/contratos/${contratoId}/estado`,
        { estado: accion === 'aprobado' ? 'activo' : 'rechazado' },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Actualizar la lista de contratos
        const updatedContratos = contracts.map(contrato => 
          contrato.id === contratoId 
            ? { ...contrato, estado: accion === 'aprobado' ? 'activo' : 'rechazado' }
            : contrato
        );
        setContracts(updatedContratos);
        handleCloseDialog();
        setSuccess(`Contrato ${accion === 'aprobado' ? 'activado' : 'rechazado'} exitosamente`);
      } else {
        setError(response.data.message || 'Error al actualizar el estado del contrato');
      }
    } catch (error) {
      console.error('Error al actualizar estado del contrato:', error);
      setError(error.response?.data?.message || 'Error al actualizar el estado del contrato');
    } finally {
      setLoading(false);
    }
  };

  // Función para ver la historia médica
  const handleViewMedicalHistory = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Intentando obtener historia médica para contrato:', selectedContract.id);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/contratos/${selectedContract.id}/historia-medica`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          Accept: 'application/pdf'
        },
        responseType: 'blob'
      });

      console.log('Respuesta recibida:', {
        status: response.status,
        type: response.headers['content-type'],
        size: response.data.size
      });

      // Crear URL del blob y abrir en nueva pestaña
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Crear un iframe oculto para mostrar el PDF
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      // Cargar el PDF en el iframe
      iframe.src = url;
      
      // Esperar a que el iframe cargue
      iframe.onload = () => {
        // Abrir el PDF en una nueva ventana
        window.open(url, '_blank');
        // Limpiar
        document.body.removeChild(iframe);
        window.URL.revokeObjectURL(url);
      };
    } catch (error) {
      console.error('Error al obtener historia médica:', error);
      setError(error.response?.data?.message || 'Error al obtener la historia médica');
    } finally {
      setLoading(false);
    }
  };

  const handleInsuranceChange = async (e) => {
    const seguroId = e.target.value;
    setFormData(prev => ({ ...prev, seguro_id: seguroId }));
    
    if (seguroId) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${API_URL}/seguros/${seguroId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (response.data.success) {
          setSelectedInsuranceDetails(response.data.data);
        }
      } catch (error) {
        console.error('Error al cargar detalles del seguro:', error);
      }
    } else {
      setSelectedInsuranceDetails(null);
    }
  };

  // Función para manejar la subida de documentos personales del cliente
  const handleClientDocumentsChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setSnackbar({
          open: true,
          message: 'Los documentos personales deben ser un archivo PDF',
          severity: 'error'
        });
        return;
      }
      setClientDocuments(file);
      setSnackbar({
        open: true,
        message: 'Archivo seleccionado: ' + file.name,
        severity: 'success'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Función para ver los documentos personales del cliente
  const handleViewClientDocuments = async (contratoId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/contratos/${contratoId}/documentos-cliente`,
        {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
        }
      );

      // Crear un blob con el PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Abrir el PDF en una nueva pestaña
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error al obtener documentos del cliente:', error);
      setSnackbar({
        open: true,
        message: 'Error al obtener los documentos del cliente',
        severity: 'error'
      });
    }
  };

  // Función para ver los documentos de un beneficiario
  const handleViewBeneficiaryDocuments = async (contratoId, beneficiarioIndex) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Obtener la ruta del documento del beneficiario
      const documentosBeneficiarios = JSON.parse(selectedContract.documentos_beneficiarios);
      console.log('Documentos beneficiarios:', documentosBeneficiarios);
      
      if (!documentosBeneficiarios || !documentosBeneficiarios[beneficiarioIndex]) {
        throw new Error('No se encontró la ruta del documento para este beneficiario');
      }

      // Obtener la ruta del documento como string
      const documentoPath = documentosBeneficiarios[beneficiarioIndex];
      console.log('Ruta del documento:', documentoPath);

      // Construir la URL correcta para obtener el documento
      const requestUrl = `${API_URL}/uploads/${documentoPath}`;
      console.log('URL de la petición:', requestUrl);

      const response = await axios.get(
        requestUrl,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            Accept: 'application/pdf'
          },
          responseType: 'blob'
        }
      );

      // Verificar que la respuesta sea válida
      if (!response.data || response.data.size === 0) {
        throw new Error('No se encontraron documentos para este beneficiario');
      }

      // Crear un blob con el PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Crear un iframe oculto para mostrar el PDF
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      // Cargar el PDF en el iframe
      iframe.src = blobUrl;
      
      // Esperar a que el iframe cargue
      iframe.onload = () => {
        // Abrir el PDF en una nueva ventana
        window.open(blobUrl, '_blank');
        // Limpiar
        document.body.removeChild(iframe);
        window.URL.revokeObjectURL(blobUrl);
      };
    } catch (error) {
      console.error('Error al obtener documentos del beneficiario:', error);
      console.error('Detalles del error:', {
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error al obtener los documentos del beneficiario',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para ver la firma del cliente
  const handleViewSignature = async (contratoId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/contratos/${contratoId}/firma`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Crear un blob con la imagen de la firma
      const blob = new Blob([response.data], { type: 'image/png' });
      const url = window.URL.createObjectURL(blob);
      
      // Abrir la firma en una nueva pestaña
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error al obtener la firma:', error);
      setSnackbar({
        open: true,
        message: 'Error al obtener la firma del cliente',
        severity: 'error'
      });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        {userRole === 'agente' ? 'Gestión de Contratos' : 'Mis Contratos'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {userRole === 'agente' && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleEdit()}
              sx={{ mb: 2 }}
            >
              Crear Nuevo Contrato
            </Button>
          )}

          <TableContainer component={Paper}>
        <Table>
          <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Seguro</TableCell>
                  <TableCell>Fecha Inicio</TableCell>
                  <TableCell>Fecha Fin</TableCell>
                  <TableCell>Monto Prima</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
                {contracts.length > 0 ? (
                  contracts.map((contract) => (
              <TableRow key={contract.id}>
                      <TableCell>{contract.id}</TableCell>
                      <TableCell>{contract.cliente?.nombre || contract.nombre_cliente || 'N/A'}</TableCell>
                      <TableCell>{contract.seguro?.nombre || contract.nombre_seguro || 'N/A'}</TableCell>
                <TableCell>{new Date(contract.fecha_inicio).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(contract.fecha_fin).toLocaleDateString()}</TableCell>
                      <TableCell>${contract.monto_prima}</TableCell>
                <TableCell>
                  <Chip
                    label={contract.estado}
                          color={
                            contract.estado === 'activo' ? 'success' :
                            contract.estado === 'pendiente' ? 'warning' :
                            contract.estado === 'rechazado' ? 'error' :
                            'default'
                          }
                  />
                </TableCell>
                <TableCell>
                        {userRole === 'agente' ? (
                          <>
                            <IconButton onClick={() => handleEdit(contract)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton onClick={() => handleDelete(contract.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </>
                        ) : (
                          <Button
                            variant="outlined"
                      size="small"
                            onClick={() => handleEdit(contract)}
                          >
                            Completar Documentos
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No hay contratos disponibles
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedContract ? 'Editar Contrato' : 'Nuevo Contrato'}
        </DialogTitle>
        <DialogContent>
          {userRole === 'cliente' ? (
            <>
              {/* Información del Contrato */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Información del Contrato
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Cliente"
                      value={selectedContract?.nombre_cliente || ''}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Seguro"
                      value={selectedContract?.nombre_seguro || ''}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Fecha de Inicio"
                      value={selectedContract?.fecha_inicio ? new Date(selectedContract.fecha_inicio).toLocaleDateString() : ''}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Fecha de Fin"
                      value={selectedContract?.fecha_fin ? new Date(selectedContract.fecha_fin).toLocaleDateString() : ''}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Monto de Prima"
                      value={`$${selectedContract?.monto_prima || ''}`}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Estado"
                      value={selectedContract?.estado || ''}
                      disabled
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Información de Pago */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Información de Pago
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Método de Pago"
                      value={selectedContract?.forma_pago || ''}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Frecuencia de Pago"
                      value={selectedContract?.frecuencia_pago || ''}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Monto por Pago"
                      value={`$${selectedContract?.monto_pago || ''}`}
                      disabled
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Detalles del Seguro */}
              {selectedInsuranceDetails && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, mt: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Detalles del Seguro
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle1">
                          <strong>Tipo:</strong> {selectedInsuranceDetails.tipo === 'medico' ? 'Médico' : 'Vida'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle1">
                          <strong>Cobertura:</strong>{' '}
                          {selectedInsuranceDetails.tipo === 'medico' 
                            ? `${selectedInsuranceDetails.cobertura}% de gastos médicos`
                            : `$${selectedInsuranceDetails.cobertura} en caso de fallecimiento`}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle1">
                          <strong>Beneficios:</strong>
                        </Typography>
                        <List>
                          {selectedInsuranceDetails.beneficios.split(',').map((beneficio, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <CheckCircleIcon color="success" />
                              </ListItemIcon>
                              <ListItemText primary={beneficio.trim()} />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle1">
                          <strong>Requisitos:</strong>
                        </Typography>
                        <List>
                          {selectedInsuranceDetails.requisitos.split(',').map((requisito, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <InfoIcon color="info" />
                              </ListItemIcon>
                              <ListItemText primary={requisito.trim()} />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              )}

              {/* Documentos del Cliente */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Documentos del Cliente
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2
                      }}
                    >
                      <Typography variant="subtitle2">
                        Historia Médica
                      </Typography>
                      {selectedContract?.historia_medica_path ? (
                        <Alert severity="success">
                          Historia médica subida correctamente
                        </Alert>
                      ) : (
                        <>
                          <Button
                            variant="outlined"
                            component="label"
                            startIcon={<UploadIcon />}
                          >
                            Subir Historia Médica
                            <input
                              type="file"
                              hidden
                              accept=".pdf"
                              onChange={handleMedicalHistoryChange}
                            />
                          </Button>
                          {medicalHistory && (
                            <Typography variant="body2" color="textSecondary">
                              Archivo seleccionado: {medicalHistory.name}
                            </Typography>
                          )}
                        </>
                      )}
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2
                      }}
                    >
                      <Typography variant="subtitle2">
                        Documentos Personales
                      </Typography>
                      {selectedContract?.documentos_cliente_path ? (
                        <Alert severity="success">
                          Documentos personales subidos correctamente
                        </Alert>
                      ) : (
                        <>
                          <Button
                            variant="outlined"
                            component="label"
                            startIcon={<UploadIcon />}
                          >
                            Subir Documentos Personales
                            <input
                              type="file"
                              hidden
                              accept=".pdf"
                              onChange={handleClientDocumentsChange}
                            />
                          </Button>
                          {clientDocuments && (
                            <Typography variant="body2" color="textSecondary">
                              Archivo seleccionado: {clientDocuments.name}
                            </Typography>
                          )}
                        </>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>

              {/* Beneficiarios */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Beneficiarios
                </Typography>
                <List>
                  {beneficiaries.map((beneficiario, index) => (
                    <ListItem key={index}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="Nombre"
                            value={beneficiario.nombre}
                            onChange={e => handleBeneficiaryChange(index, 'nombre', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="Parentesco"
                            value={beneficiario.parentesco}
                            onChange={e => handleBeneficiaryChange(index, 'parentesco', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            type="date"
                            label="Fecha de Nacimiento"
                            value={beneficiario.fecha_nacimiento}
                            onChange={e => handleBeneficiaryChange(index, 'fecha_nacimiento', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                      </Grid>
                    </ListItem>
                  ))}
                </List>
                <Button variant="outlined" onClick={handleAddBeneficiary} sx={{ mt: 2 }}>
                  Agregar Beneficiario
                </Button>
              </Grid>

              {/* Sección de firma */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Firma del Cliente
                </Typography>
                {selectedContract?.firma_cliente && !signature ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography>Firma existente</Typography>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        if (signaturePad) {
                          signaturePad.clear();
                          setSignature(null);
                        }
                      }}
                    >
                      Limpiar Firma
                    </Button>
                  </Box>
                ) : (
                  <>
                    <Box sx={{ border: '1px solid #ccc', borderRadius: 1, p: 1 }}>
                      <SignaturePad
                        ref={(ref) => setSignaturePad(ref)}
                        canvasProps={{
                          width: 500,
                          height: 200,
                          className: 'signature-canvas'
                        }}
                        onEnd={handleSignatureEnd}
                      />
                    </Box>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        onClick={handleRestoreSignature}
                        disabled={!signature}
                      >
                        Restaurar Firma
                      </Button>
                    </Box>
                  </>
                )}
              </Box>
            </>
          ) : (
            // Vista para agente/admin
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Cliente</InputLabel>
                    <Select
                      name="cliente_id"
                      value={formData.cliente_id}
                      onChange={handleInputChange}
                      required
                      disabled={!!selectedContract}
                    >
                      {clients.map((client) => (
                        <MenuItem key={client.id} value={client.id}>
                          {client.nombre} {client.apellido}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Seguro</InputLabel>
                    <Select
                      name="seguro_id"
                      value={formData.seguro_id}
                    onChange={handleInsuranceChange}
                      required
                      disabled={!!selectedContract}
                    >
                      {insurances.map((insurance) => (
                        <MenuItem key={insurance.id} value={insurance.id}>
                          {insurance.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    name="fecha_inicio"
                    label="Fecha de Inicio"
                    value={formData.fecha_inicio}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    required
                    disabled={!!selectedContract}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    name="fecha_fin"
                    label="Fecha de Fin"
                    value={formData.fecha_fin}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    required
                    disabled={!!selectedContract}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    name="monto_prima"
                    label="Monto de Prima"
                    value={formData.monto_prima}
                    onChange={handleInputChange}
                    required
                    disabled={!!selectedContract}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      name="estado"
                      value={formData.estado}
                      onChange={handleInputChange}
                      required
                    >
                      <MenuItem value="pendiente">Pendiente</MenuItem>
                      <MenuItem value="pendiente_revision">Pendiente de Revisión</MenuItem>
                      <MenuItem value="activo">Activo</MenuItem>
                      <MenuItem value="inactivo">Inactivo</MenuItem>
                      <MenuItem value="rechazado">Rechazado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

              {/* Configuración de Pago */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Configuración de Pago
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Método de Pago</InputLabel>
                    <Select
                      name="forma_pago"
                      value={formData.forma_pago}
                      onChange={handleInputChange}
                      required
                    >
                      <MenuItem value="efectivo">Efectivo</MenuItem>
                      <MenuItem value="transferencia">Transferencia Bancaria</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Frecuencia de Pago</InputLabel>
                    <Select
                      name="frecuencia_pago"
                      value={formData.frecuencia_pago}
                      onChange={handleInputChange}
                      required
                    >
                      <MenuItem value="mensual">Mensual</MenuItem>
                      <MenuItem value="trimestral">Trimestral</MenuItem>
                      <MenuItem value="semestral">Semestral</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    name="monto_pago"
                    label="Monto por Pago"
                    value={formData.monto_pago}
                    onChange={handleInputChange}
                    required
                    inputProps={{ min: 0 }}
                  />
                </Grid>

              {/* Campos bancarios (solo si el método de pago es transferencia) */}
                {formData.forma_pago === 'transferencia' && (
                  <>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        name="banco"
                        label="Banco"
                        value={formData.banco}
                        onChange={handleInputChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        name="numero_cuenta"
                        label="Número de Cuenta"
                        value={formData.numero_cuenta}
                        onChange={handleInputChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Tipo de Cuenta</InputLabel>
                        <Select
                          name="tipo_cuenta"
                          value={formData.tipo_cuenta}
                          onChange={handleInputChange}
                          required
                        >
                          <MenuItem value="ahorro">Ahorro</MenuItem>
                          <MenuItem value="corriente">Corriente</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </>
                )}

              {/* Detalles del Seguro */}
              {selectedInsuranceDetails && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, mt: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Detalles del Seguro
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle1">
                          <strong>Tipo:</strong> {selectedInsuranceDetails.tipo === 'medico' ? 'Médico' : 'Vida'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle1">
                          <strong>Cobertura:</strong>{' '}
                          {selectedInsuranceDetails.tipo === 'medico' 
                            ? `${selectedInsuranceDetails.cobertura}% de gastos médicos`
                            : `$${selectedInsuranceDetails.cobertura} en caso de fallecimiento`}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle1">
                          <strong>Beneficios:</strong>
                        </Typography>
                        <List>
                          {selectedInsuranceDetails.beneficios.split(',').map((beneficio, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <CheckCircleIcon color="success" />
                              </ListItemIcon>
                              <ListItemText primary={beneficio.trim()} />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle1">
                          <strong>Requisitos:</strong>
                        </Typography>
                        <List>
                          {selectedInsuranceDetails.requisitos.split(',').map((requisito, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <InfoIcon color="info" />
                              </ListItemIcon>
                              <ListItemText primary={requisito.trim()} />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              )}

              {/* Documentos y Beneficiarios (solo visible cuando se está editando un contrato) */}
        {selectedContract && (
          <>
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                        Documentos del Cliente
                      </Typography>
                    </Grid>

                    {/* Historia Médica */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                        Historia Médica
                </Typography>
                      {selectedContract.historia_medica_path ? (
                        <Box>
                          <Alert severity="success" sx={{ mb: 2 }}>
                            Historia médica subida correctamente
                          </Alert>
                          <Button
                            variant="outlined"
                            onClick={() => handleViewMedicalHistory(selectedContract.id)}
                            startIcon={<VisibilityIcon />}
                          >
                            Ver Historia Médica
                          </Button>
                        </Box>
                      ) : (
                        <Alert severity="warning">
                          No se ha subido historia médica
                        </Alert>
                      )}
                    </Paper>
                  </Grid>

                  {/* Documentos Personales */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Documentos Personales
                      </Typography>
                      {selectedContract.documentos_cliente_path ? (
                        <Box>
                          <Alert severity="success" sx={{ mb: 2 }}>
                            Documentos personales subidos correctamente
                          </Alert>
                          <Button
                            variant="outlined"
                            onClick={() => handleViewClientDocuments(selectedContract.id)}
                            startIcon={<VisibilityIcon />}
                          >
                            Ver Documentos Personales
                          </Button>
                        </Box>
                      ) : (
                        <Alert severity="warning">
                          No se han subido documentos personales
                        </Alert>
                      )}
                    </Paper>
                    </Grid>

                    {/* Beneficiarios */}
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                        Beneficiarios
                      </Typography>
                      {Array.isArray(selectedContract?.beneficiarios) && selectedContract.beneficiarios.length > 0 ? (
                        <List>
                          {(selectedContract?.beneficiarios || []).map((beneficiario, index) => {
                            // Verificar si existe un documento para este beneficiario
                            const tieneDocumento = selectedContract.documentos_beneficiarios && 
                              selectedContract.documentos_beneficiarios[index] !== undefined;
                            return (
                              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                                <ListItem>
                                  <ListItemText
                                    primary={`${beneficiario.nombre} ${beneficiario.apellido}`}
                                    secondary={
                                      <>
                                        <Typography component="span" variant="body2">
                                          Parentesco: {beneficiario.parentesco}
                                        </Typography>
                                        <br />
                                        <Typography component="span" variant="body2">
                                          Fecha de Nacimiento: {new Date(beneficiario.fecha_nacimiento).toLocaleDateString()}
                                        </Typography>
                                      </>
                                    }
                                  />
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    {tieneDocumento ? (
                                      <Button
                                        variant="outlined"
                                        onClick={() => handleViewBeneficiaryDocuments(selectedContract.id, index)}
                                        startIcon={<VisibilityIcon />}
                                        disabled={loading}
                                      >
                                        {loading ? 'Cargando...' : 'Ver Documentos'}
                                      </Button>
                                    ) : (
                                      <Typography variant="body2" color="text.secondary">
                                        Sin documentos
                                      </Typography>
                                    )}
                                  </Box>
                                </ListItem>
                              </Paper>
                            );
                          })}
                        </List>
                      ) : (
                        <Alert severity="warning">
                          No se han registrado beneficiarios
                        </Alert>
                      )}
                    </Grid>

                    {/* Firma */}
                    <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                        Firma del Cliente
                </Typography>
                      {selectedContract.firma_cliente ? (
                      <Box>
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Contrato firmado correctamente
                          </Alert>
                        <Button
                          variant="outlined"
                          onClick={() => handleViewSignature(selectedContract.id)}
                          startIcon={<VisibilityIcon />}
                        >
                          Ver Firma
                        </Button>
                        </Box>
                      ) : (
                        <Alert severity="warning">
                        El contrato no ha sido firmado
                        </Alert>
                      )}
                    </Grid>

                    {/* Acciones de Aprobación */}
                  {selectedContract.estado === 'pendiente' && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => handleApproveReject(selectedContract.id, 'aprobado')}
                          startIcon={<CheckIcon />}
                        >
                          Aprobar Contrato
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => handleApproveReject(selectedContract.id, 'rechazado')}
                          startIcon={<CloseIcon />}
                        >
                          Rechazar Contrato
                        </Button>
                      </Box>
                    </Grid>
                  )}
                </>
              )}
            </Grid>
          )}
            </DialogContent>
            <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Cancelar
          </Button>
              <Button
            onClick={handleSubmit} 
                variant="contained"
            color="primary"
            disabled={loading}
              >
            {selectedContract ? 'Actualizar Contrato' : 'Crear Contrato'}
              </Button>
            </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ContractManagement; 