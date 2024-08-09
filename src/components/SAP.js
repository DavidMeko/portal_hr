import React, { useState, useEffect, useCallback } from 'react';
import { Typography, TextField, Grid, Card, CardContent, Avatar, Pagination, Box, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import debounce from 'lodash/debounce';
import EmployeeDetails from './EmployeeDetails';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[4],
  },
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: theme.spacing(10),
  height: theme.spacing(10),
  margin: '0 auto',
  marginBottom: theme.spacing(2),
}));

const SAP = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [employees, setEmployees] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const rowsPerPage = 12; // Number of cards per page

    const debouncedSearch = useCallback(
        debounce((query) => {
            handleSearch(query);
        }, 300),
        []
    );

    useEffect(() => {
        debouncedSearch(searchQuery);
    }, [searchQuery, page]);

    const handleSearch = async (query) => {
        setLoading(true);
        try {
            const result = await window.electron.ipcRenderer.invoke('search-sap-employees', query, page, rowsPerPage, 'sap_name', 'asc');
            setEmployees(result.employees);
            setTotalPages(Math.ceil(result.total / rowsPerPage));
        } catch (error) {
            console.error('Error searching SAP employees:', error);
        }
        setLoading(false);
    };

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const handleCardClick = (employee) => {
        setSelectedEmployee(employee);
    };

    return (
        <Box sx={{ height: '100%', width: '100%', p: 2, overflow: 'auto' }}>
            <Typography variant="h5" gutterBottom>SAP Employee Search</Typography>
            <TextField
                fullWidth
                label="Search by name or employee ID"
                variant="outlined"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ mb: 2 }}
            />
            {loading && <CircularProgress sx={{ display: 'block', margin: '0 auto' }} />}
            <Grid container spacing={3}>
                {employees.map((employee) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={employee.sap_employee_id}>
                        <StyledCard onClick={() => handleCardClick(employee)}>
                            <CardContent>
                                <StyledAvatar src="/api/placeholder/100/100" alt={employee.sap_name} />
                                <Typography variant="h6" align="center" gutterBottom>
                                    {employee.sap_name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" align="center">
                                    ID: {employee.sap_employee_id}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" align="center">
                                    Status: {employee.sap_status || 'N/A'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" align="center">
                                    Department: {employee.sap_department || 'N/A'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" align="center">
                                    Phone: {employee.sap_phone || 'N/A'}
                                </Typography>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                ))}
            </Grid>
            {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination 
                        count={totalPages} 
                        page={page} 
                        onChange={handlePageChange} 
                        color="primary" 
                    />
                </Box>
            )}
            <EmployeeDetails 
                open={!!selectedEmployee} 
                onClose={() => setSelectedEmployee(null)} 
                employee={selectedEmployee}
                system="sap"
            />
        </Box>
    );
};

export default SAP;