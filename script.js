<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Leashed App</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
    <div id="root"></div>

    <script type="text/babel">

        // IMPORTANT: Replace these placeholder values with your actual Firebase project configuration
        const __firebase_config = `{
            "apiKey": "YOUR_API_KEY",
            "authDomain": "YOUR_PROJECT_ID.firebaseapp.com",
            "projectId": "YOUR_PROJECT_ID",
            "storageBucket": "YOUR_PROJECT_ID.appspot.com",
            "messagingSenderId": "YOUR_SENDER_ID",
            "appId": "YOUR_APP_ID"
        }`;
        const __app_id = "default-app-id"; // You can set a unique ID here if needed
        const __initial_auth_token = null;


        // Paste your entire application code here, starting from the imports.
        // NOTE: I have corrected the firebase import paths below.

        const { useState, useEffect, useCallback } = React;

        import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
        import {
            getAuth,
            signInAnonymously,
            signInWithCustomToken,
            onAuthStateChanged,
        } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
        import {
            getFirestore,
            doc,
            addDoc,
            setDoc,
            getDoc,
            deleteDoc,
            onSnapshot,
            collection,
            query,
            where,
            getDocs,
            updateDoc,
            writeBatch,
        } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';


        // --- Helper Functions & Constants ---
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
        const LOGO_URL = "https://storage.googleapis.com/leashed-assets/leashed_logo.png";

        // --- SVG Icons ---
        const CheckIcon = ({ className }) => (
            <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        );
        const MapPinIcon = ({ className }) => (
            <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        );
        const NoteIcon = ({ className }) => (
            <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        );
        const DollarSignIcon = ({ className }) => (
            <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V3m0 18v-3.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        );
        const UsersIcon = ({ className }) => (
            <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-3-3H5a3 3 0 00-3 3v2h5m-1-12a4 4 0 11-8 0 4 4 0 018 0zm-1 9a3 3 0 00-3-3H5a3 3 0 00-3 3v2h14v-2a3 3 0 00-3-3z" />
            </svg>
        );


        // --- Utility Functions ---
        const hashPassword = async (password) => {
            if (!password) return null;
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        };

        // --- UI Components ---
        const CustomModal = ({ children, onClose }) => (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
                <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg relative transform transition-all duration-300 scale-95 animate-modal-in">
                    {children}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            </div>
        );

        const CustomAlert = ({ message, onClose }) => (
            <CustomModal onClose={onClose}>
                <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{message}</h3>
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                    >
                        Close
                    </button>
                </div>
            </CustomModal>
        );

        // --- Login Page ---
        const LoginPage = ({ onLogin, alert }) => {
            const [username, setUsername] = useState('');
            const [password, setPassword] = useState('');
            const [isLoading, setIsLoading] = useState(false);

            const handleLogin = async (e) => {
                e.preventDefault();
                if (!username || !password) {
                    alert("Username and password are required.");
                    return;
                }
                setIsLoading(true);
                await onLogin(username, password);
                setIsLoading(false);
            };

            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-4">
                    <div className="text-center mb-10">
                        <img src={LOGO_URL} alt="Leashed Logo" className="w-48 mx-auto mb-4" />
                        <h1 className="text-4xl font-bold text-gray-800">Welcome to Leashed</h1>
                        <p className="text-gray-500 mt-2">Your trusted partner in pet care.</p>
                    </div>
                    <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl">
                        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Sign In</h2>
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                                <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your.username" className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
                            </div>
                            <div>
                                <label htmlFor="password"className="block text-sm font-medium text-gray-700">Password</label>
                                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-md font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105">
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </form>
                    </div>
                </div>
            );
        };

        // --- Admin Dashboard Components ---
        const UserCreationForm = ({ fields, onAdd, type, alert }) => {
            const [formData, setFormData] = useState({});

            const handleAdd = () => {
                const missingField = fields.find(f => !formData[f.name]);
                if (missingField) {
                    alert(`Please fill out the ${missingField.placeholder} field.`);
                    return;
                }
                onAdd(formData);
                setFormData({});
            };

            return (
                <div className="space-y-4">
                    {fields.map(field => (
                        <input
                            key={field.name}
                            type={field.type}
                            value={formData[field.name] || ''}
                            onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                            placeholder={field.placeholder}
                            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                        />
                    ))}
                    <button onClick={handleAdd} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg">Create {type}</button>
                </div>
            );
        };

        const MiniCFOPage = ({ db, alert }) => {
            const [metrics, setMetrics] = useState({
                totalClients: 0,
                activeWalkers: 0,
                weeklyBillableHours: 0,
                monthlyRevenue: 0,
                monthlyExpenses: 0,
                clientAcquisitionCost: 0,
                businessValuation: 0,
                areasForImprovement: ''
            });
            const [loadingMetrics, setLoadingMetrics] = useState(true);

            useEffect(() => {
                if (!db) return;
                const docRef = doc(db, `artifacts/${appId}/public/data/businessMetrics`, 'currentMetrics');
                const unsub = onSnapshot(docRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setMetrics(docSnap.data());
                    } else {
                        // Initialize with default values if document doesn't exist
                        setMetrics({
                            totalClients: 0,
                            activeWalkers: 0,
                            weeklyBillableHours: 0,
                            monthlyRevenue: 0,
                            monthlyExpenses: 0,
                            clientAcquisitionCost: 0,
                            businessValuation: 0,
                            areasForImprovement: ''
                        });
                    }
                    setLoadingMetrics(false);
                }, (error) => {
                    console.error("Error fetching business metrics:", error);
                    alert("Failed to load business metrics. Please try again.");
                    setLoadingMetrics(false);
                });

                return () => unsub();
            }, [db, alert]);

            const handleMetricChange = (e) => {
                const { name, value, type } = e.target;
                setMetrics(prev => ({
                    ...prev,
                    [name]: type === 'number' ? parseFloat(value) || 0 : value
                }));
            };

            const handleSaveMetrics = async () => {
                if (!db) {
                    alert("Database not connected.");
                    return;
                }
                setLoadingMetrics(true);
                try {
                    const docRef = doc(db, `artifacts/${appId}/public/data/businessMetrics`, 'currentMetrics');
                    await setDoc(docRef, metrics, { merge: true });
                    alert("Business metrics saved successfully!");
                } catch (error) {
                    console.error("Error saving business metrics:", error);
                    alert("Failed to save business metrics. Please try again.");
                } finally {
                    setLoadingMetrics(false);
                }
            };

            if (loadingMetrics) {
                return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div></div>;
            }

            return (
                <div className="bg-white p-6 rounded-xl shadow-lg space-y-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Mini CFO Dashboard</h3>
                    <p className="text-gray-600 mb-6">Input and visualize key business health metrics.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <label htmlFor="totalClients" className="block text-sm font-medium text-blue-700">Total Clients</label>
                            <input type="number" id="totalClients" name="totalClients" value={metrics.totalClients} onChange={handleMetricChange} className="mt-1 block w-full p-2 border rounded-md bg-white" />
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <label htmlFor="activeWalkers" className="block text-sm font-medium text-blue-700">Active Walkers</label>
                            <input type="number" id="activeWalkers" name="activeWalkers" value={metrics.activeWalkers} onChange={handleMetricChange} className="mt-1 block w-full p-2 border rounded-md bg-white" />
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <label htmlFor="weeklyBillableHours" className="block text-sm font-medium text-blue-700">Weekly Billable Hours</label>
                            <input type="number" id="weeklyBillableHours" name="weeklyBillableHours" value={metrics.weeklyBillableHours} onChange={handleMetricChange} className="mt-1 block w-full p-2 border rounded-md bg-white" />
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <label htmlFor="monthlyRevenue" className="block text-sm font-medium text-green-700">Monthly Revenue ($)</label>
                            <input type="number" id="monthlyRevenue" name="monthlyRevenue" value={metrics.monthlyRevenue} onChange={handleMetricChange} className="mt-1 block w-full p-2 border rounded-md bg-white" />
                        </div>
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                            <label htmlFor="monthlyExpenses" className="block text-sm font-medium text-red-700">Monthly Expenses ($)</label>
                            <input type="number" id="monthlyExpenses" name="monthlyExpenses" value={metrics.monthlyExpenses} onChange={handleMetricChange} className="mt-1 block w-full p-2 border rounded-md bg-white" />
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <label htmlFor="clientAcquisitionCost" className="block text-sm font-medium text-purple-700">Client Acquisition Cost ($)</label>
                            <input type="number" id="clientAcquisitionCost" name="clientAcquisitionCost" value={metrics.clientAcquisitionCost} onChange={handleMetricChange} className="mt-1 block w-full p-2 border rounded-md bg-white" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <h4 className="font-semibold text-yellow-800">Calculated Monthly Profit</h4>
                            <p className="text-3xl font-bold text-yellow-900">${(metrics.monthlyRevenue - metrics.monthlyExpenses).toFixed(2)}</p>
                        </div>
                        <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                            <label htmlFor="businessValuation" className="block text-sm font-medium text-teal-700">Business Valuation ($)</label>
                            <input type="number" id="businessValuation" name="businessValuation" value={metrics.businessValuation} onChange={handleMetricChange} className="mt-1 block w-full p-2 border rounded-md bg-white" />
                            <p className="text-xs text-gray-500 mt-1">Manually input based on your valuation model.</p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <label htmlFor="areasForImprovement" className="block text-md font-medium text-gray-700 mb-2">Areas for Improvement / Strategic Notes</label>
                        <textarea id="areasForImprovement" name="areasForImprovement" value={metrics.areasForImprovement} onChange={handleMetricChange} rows="5" className="w-full p-3 border border-gray-300 bg-gray-50 rounded-lg focus:ring-2 focus:ring-indigo-500"></textarea>
                    </div>

                    <button onClick={handleSaveMetrics} disabled={loadingMetrics} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-indigo-400 disabled:cursor-not-allowed">
                        {loadingMetrics ? 'Saving...' : 'Save Metrics'}
                    </button>
                </div>
            );
        };


        const AdminDashboard = ({ db, alert, onSchedule }) => {
            const [activeTab, setActiveTab] = useState('schedule');
            const [walkers, setWalkers] = useState([]);
            const [clients, setClients] = useState([]);
            const [admins, setAdmins] = useState([]);
            const [services, setServices] = useState([]);
            const [pets, setPets] = useState({});
            const [newScheduleEntry, setNewScheduleEntry] = useState({ date: new Date().toISOString().split('T')[0], time: '', clientId: '', petId: '', serviceId: '', walkerId: '', notes: '' });

            useEffect(() => {
                if(!db) return;
                const unsubWalkers = onSnapshot(collection(db, `artifacts/${appId}/public/data/walkers`), (snap) => setWalkers(snap.docs.map(d => ({id: d.id, ...d.data()}))));
                const unsubClients = onSnapshot(collection(db, `artifacts/${appId}/public/data/clients`), (snap) => setClients(snap.docs.map(d => ({id: d.id, ...d.data()}))));
                const unsubAdmins = onSnapshot(collection(db, `artifacts/${appId}/public/data/admins`), (snap) => setAdmins(snap.docs.map(d => ({id: d.id, ...d.data()}))));
                const unsubServices = onSnapshot(collection(db, `artifacts/${appId}/public/data/services`), (snap) => setServices(snap.docs.map(d => ({id: d.id, ...d.data()}))));
                return () => { unsubWalkers(); unsubClients(); unsubAdmins(); unsubServices(); };
            }, [db]);

            useEffect(() => {
                if (!db || clients.length === 0) {
                    setPets({});
                    return;
                };
                const unsubscribers = clients.map(client => {
                    const petsRef = collection(db, `artifacts/${appId}/public/data/clients/${client.id}/pets`);
                    return onSnapshot(petsRef, snapshot => {
                        setPets(prev => ({ ...prev, [client.id]: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) }));
                    });
                });
                return () => unsubscribers.forEach(unsub => unsub());
            }, [db, clients]);

            const handleCreateUser = async (type, data) => {
                try {
                    const { name, contactInfo, username, password } = data;
                    const passwordHash = await hashPassword(password);
                    
                    if (type === 'walker') {
                        await addDoc(collection(db, `artifacts/${appId}/public/data/walkers`), { name, username: username.toLowerCase(), passwordHash });
                        alert(`Walker "${name}" created.`);
                    } else if (type === 'client') {
                         await addDoc(collection(db, `artifacts/${appId}/public/data/clients`), { name, contactInfo, username: username.toLowerCase(), passwordHash });
                        alert(`Client "${name}" created.`);
                    } else if (type === 'admin') {
                        await setDoc(doc(db, `artifacts/${appId}/public/data/admins`, username.toLowerCase()), { username: username.toLowerCase(), passwordHash });
                        alert(`Admin "${username}" created.`);
                    }
                } catch (error) {
                    console.error(`Error creating ${type}:`, error);
                    alert(`Failed to create ${type}. A user with that username may already exist.`);
                }
            };
            
            const handleDeleteUser = async (type, id, name) => {
                if (type === 'admin' && id === 'admin') return alert("Cannot delete the primary admin account.");
                // A custom confirmation modal would be better than window.confirm
                if (window.confirm(`Are you sure you want to delete ${type} "${name}"? This action cannot be undone.`)) {
                     try {
                        await deleteDoc(doc(db, `artifacts/${appId}/public/data/${type}s`, id));
                        alert(`${type} deleted successfully.`);
                    } catch (error) { console.error(`Error deleting ${type}:`, error); alert(`Failed to delete ${type}.`); }
                }
            };
            
            const handleScheduleSubmit = () => {
                if (!newScheduleEntry.clientId || !newScheduleEntry.petId || !newScheduleEntry.serviceId || !newScheduleEntry.date || !newScheduleEntry.time) {
                    return alert("Please fill out all required schedule fields.");
                }
                onSchedule({ ...newScheduleEntry, isRecurring: false }); // Simplified for admin
                setNewScheduleEntry({ date: new Date().toISOString().split('T')[0], time: '', clientId: '', petId: '', serviceId: '', walkerId: '', notes: '' });
            };
            
            const renderContent = () => {
                const commonInputClass = "w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition";
                switch(activeTab) {
                    case 'schedule':
                        return <div className="bg-white p-6 rounded-xl shadow-lg"><h3 className="text-xl font-semibold mb-4 text-gray-800">Schedule a Service</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"><select value={newScheduleEntry.clientId} onChange={e => setNewScheduleEntry({...newScheduleEntry, clientId: e.target.value, petId: ''})} className={commonInputClass}><option value="">Select Client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><select value={newScheduleEntry.petId} onChange={e => setNewScheduleEntry({...newScheduleEntry, petId: e.target.value})} className={commonInputClass} disabled={!newScheduleEntry.clientId}><option value="">Select Pet</option>{(pets[newScheduleEntry.clientId] || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><select value={newScheduleEntry.serviceId} onChange={e => setNewScheduleEntry({...newScheduleEntry, serviceId: e.target.value})} className={commonInputClass}><option value="">Select Service</option>{services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><select value={newScheduleEntry.walkerId} onChange={e => setNewScheduleEntry({...newScheduleEntry, walkerId: e.target.value})} className={commonInputClass}><option value="">Assign Walker (Optional)</option>{walkers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select><input type="date" value={newScheduleEntry.date} onChange={e => setNewScheduleEntry({...newScheduleEntry, date: e.target.value})} className={commonInputClass}/><input type="time" value={newScheduleEntry.time} onChange={e => setNewScheduleEntry({...newScheduleEntry, time: e.target.value})} className={commonInputClass}/></div><button onClick={handleScheduleSubmit} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 mt-6 transition-all duration-200 shadow-md hover:shadow-lg">Book Service</button></div>;
                    case 'clients':
                    case 'walkers':
                    case 'admins':
                        const type = activeTab.slice(0, -1);
                        const userList = { clients, walkers, admins }[activeTab];
                        const creationFields = {
                            client: [{name: 'name', placeholder: 'Client Name', type: 'text'}, {name: 'contactInfo', placeholder: 'Contact Info', type: 'text'}, {name: 'username', placeholder: 'Username', type: 'text'}, {name: 'password', placeholder: 'Password', type: 'password'}],
                            walker: [{name: 'name', placeholder: 'Walker Name', type: 'text'}, {name: 'username', placeholder: 'Username', type: 'text'}, {name: 'password', placeholder: 'Password', type: 'password'}],
                            admin: [{name: 'username', placeholder: 'Username', type: 'text'}, {name: 'password', placeholder: 'Password', type: 'password'}]
                        }[type];

                        return <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><div className="bg-white p-6 rounded-xl shadow-lg"><h3 className="text-xl font-semibold mb-4 text-gray-800">Create New {type.charAt(0).toUpperCase() + type.slice(1)}</h3><UserCreationForm type={type.charAt(0).toUpperCase() + type.slice(1)} onAdd={(data) => handleCreateUser(type, data)} fields={creationFields} alert={alert} /></div><div className="bg-white p-6 rounded-xl shadow-lg"><h3 className="text-xl font-semibold mb-4 text-gray-800">Existing {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h3><div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">{userList.map(user => (<div key={user.id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center border border-gray-200"><div><p className="font-semibold text-gray-700">{user.name || user.username}</p><p className="text-sm text-gray-500">Username: {user.username}</p></div><button onClick={() => handleDeleteUser(type, user.id, user.name || user.username)} className="text-sm font-medium text-red-600 hover:text-red-800 transition">Delete</button></div>))}</div></div></div>;
                    case 'mini-cfo':
                        return <MiniCFOPage db={db} alert={alert} />;
                    default:
                        return null;
                }
            };

            return (
                <div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-2">Admin Control Panel</h2>
                    <p className="text-gray-500 mb-8">Manage all aspects of your business from one place.</p>
                    <div className="mb-8 border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            {['schedule', 'clients', 'walkers', 'admins', 'mini-cfo'].map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)} className={`${activeTab === tab ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-md capitalize transition-all duration-200`}>
                                    {tab.replace('-', ' ')}
                                </button>
                            ))}
                        </nav>
                    </div>
                    {renderContent()}
                </div>
            );
        };

        // --- Client Dashboard Component ---
        const ClientDashboard = ({ db, currentUser, alert, onSchedule }) => {
            const [clientDetails, setClientDetails] = useState(null);
            const [pets, setPets] = useState([]);
            const [schedule, setSchedule] = useState([]);
            const [services, setServices] = useState([]);
            const [amountDue, setAmountDue] = useState(0);
            const [newScheduleEntry, setNewScheduleEntry] = useState({ date: new Date().toISOString().split('T')[0], time: '', petId: '', serviceId: '', notes: '', isRecurring: false, recurrencePattern: '', recurrenceEndDate: '' });
            const [reportCardData, setReportCardData] = useState(null);

            useEffect(() => {
                if (!db || !currentUser) return;
                const unsubClient = onSnapshot(doc(db, `artifacts/${appId}/public/data/clients`, currentUser.id), (doc) => setClientDetails(doc.data()));
                const unsubPets = onSnapshot(collection(db, `artifacts/${appId}/public/data/clients/${currentUser.id}/pets`), (snap) => setPets(snap.docs.map(d => ({id: d.id, ...d.data()}))));
                const scheduleQuery = query(collection(db, `artifacts/${appId}/public/data/schedule`), where("clientId", "==", currentUser.id));
                const unsubSchedule = onSnapshot(scheduleQuery, (snap) => setSchedule(snap.docs.map(d => ({id: d.id, ...d.data()}))));
                const unsubServices = onSnapshot(collection(db, `artifacts/${appId}/public/data/services`), (snap) => setServices(snap.docs.map(d => ({id: d.id, ...d.data()}))));
                return () => { unsubClient(); unsubPets(); unsubSchedule(); unsubServices(); };
            }, [db, currentUser]);

            useEffect(() => {
                if (schedule.length > 0 && services.length > 0) {
                    const total = schedule.filter(s => s.status === 'Completed' && !s.paid).reduce((sum, job) => { const service = services.find(s => s.id === job.serviceId); return sum + (service ? Number(service.price) : 0); }, 0);
                    setAmountDue(total);
                }
            }, [schedule, services]);
            
            const handleScheduleSubmit = () => {
                if (!newScheduleEntry.petId || !newScheduleEntry.serviceId || !newScheduleEntry.date || !newScheduleEntry.time) {
                    return alert("Please select a pet, service, date, and time.");
                }
                onSchedule({ ...newScheduleEntry, clientId: currentUser.id, walkerId: null });
                setNewScheduleEntry({ date: new Date().toISOString().split('T')[0], time: '', petId: '', serviceId: '', notes: '', isRecurring: false, recurrencePattern: '', recurrenceEndDate: '' });
            };

            const showReportCard = (entry) => {
                const service = services.find(s => s.id === entry.serviceId);
                const pet = pets.find(p => p.id === entry.petId);
                setReportCardData({ ...entry, serviceName: service?.name, petName: pet?.name });
            };

            const upcomingServices = schedule.filter(s => new Date(s.date) >= new Date() && s.status === 'Scheduled').sort((a,b) => new Date(a.date) - new Date(b.date));
            const pastServices = schedule.filter(s => s.status === 'Completed').sort((a,b) => new Date(b.date) - new Date(a.date));

            if (!clientDetails) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div></div>;

            return (
                <>
                    {reportCardData && <ReportCardModal report={reportCardData} onClose={() => setReportCardData(null)} />}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-8">
                            <div className="bg-white p-6 rounded-xl shadow-lg"><h3 className="text-xl font-semibold mb-3 text-gray-800">My Profile</h3><p className="font-medium text-gray-700">{clientDetails.name}</p><p className="text-sm text-gray-500">{clientDetails.contactInfo}</p></div>
                            <div className="bg-white p-6 rounded-xl shadow-lg"><h3 className="text-xl font-semibold mb-3 text-gray-800">My Pets</h3><div className="space-y-3">{pets.map(p => <div key={p.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200"><p className="font-semibold text-gray-700">{p.name}</p><p className="text-sm text-gray-500">{p.type}</p></div>)}</div></div>
                            <div className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white p-6 rounded-xl shadow-2xl text-center"><h3 className="text-xl font-semibold mb-2">Amount Due</h3><p className="text-5xl font-bold">${amountDue.toFixed(2)}</p><button className="mt-4 bg-white text-indigo-600 font-semibold px-6 py-2 rounded-lg shadow hover:bg-gray-100 transition">Pay Now</button></div>
                        </div>
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white p-6 rounded-xl shadow-lg">
                                <h3 className="text-xl font-semibold mb-4 text-gray-800">Schedule a Service</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <select value={newScheduleEntry.petId} onChange={e => setNewScheduleEntry({...newScheduleEntry, petId: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-lg"><option value="">Select Pet</option>{pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                                    <select value={newScheduleEntry.serviceId} onChange={e => setNewScheduleEntry({...newScheduleEntry, serviceId: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-lg"><option value="">Select Service</option>{services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                                    <input type="date" value={newScheduleEntry.date} onChange={e => setNewScheduleEntry({...newScheduleEntry, date: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-lg"/>
                                    <input type="time" value={newScheduleEntry.time} onChange={e => setNewScheduleEntry({...newScheduleEntry, time: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-lg"/>
                                </div>
                                 <div className="flex items-center space-x-3 mt-4"><input type="checkbox" id="isRecurringClient" className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" checked={newScheduleEntry.isRecurring} onChange={e => setNewScheduleEntry({...newScheduleEntry, isRecurring: e.target.checked})} /><label htmlFor="isRecurringClient">Make this a recurring appointment?</label></div>
                                 {newScheduleEntry.isRecurring && (<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2"><select value={newScheduleEntry.recurrencePattern} onChange={e => setNewScheduleEntry({...newScheduleEntry, recurrencePattern: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-lg"><option value="">Select Pattern</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="mon-wed-fri">Mon-Wed-Fri</option></select><div><label className="text-sm text-gray-600">End Date</label><input type="date" value={newScheduleEntry.recurrenceEndDate} onChange={e => setNewScheduleEntry({...newScheduleEntry, recurrenceEndDate: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-lg"/></div></div>)}
                                <button onClick={handleScheduleSubmit} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 mt-4 transition-all duration-200 shadow-md hover:shadow-lg">Book Service</button>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-lg"><h3 className="text-xl font-semibold mb-4 text-gray-800">Upcoming Schedule</h3><div className="space-y-3">{upcomingServices.length > 0 ? upcomingServices.map(s => <div key={s.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200"><p className="font-semibold text-blue-800">{s.date} @ {s.time}</p><p className="text-sm text-blue-700">{services.find(srv => srv.id === s.serviceId)?.name} for {pets.find(p => p.id === s.petId)?.name}</p></div>) : <p className="text-gray-500 text-center py-4">No upcoming services.</p>}</div></div>
                            <div className="bg-white p-6 rounded-xl shadow-lg"><h3 className="text-xl font-semibold mb-4 text-gray-800">Service History</h3><div className="space-y-3 max-h-96 overflow-y-auto pr-2">{pastServices.length > 0 ? pastServices.map(s => <div key={s.id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center border border-gray-200"><div><p className="font-semibold text-gray-700">{s.date} @ {s.time}</p><p className="text-sm text-gray-500">{services.find(srv => srv.id === s.serviceId)?.name}</p></div><button onClick={() => showReportCard(s)} className="text-sm bg-indigo-500 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-600 transition">View Report</button></div>) : <p className="text-gray-500 text-center py-4">No past services.</p>}</div></div>
                        </div>
                    </div>
                </>
            );
        };

        // --- Walker Dashboard Component ---
        const WalkerDashboard = ({ db, currentUser, alert }) => {
            const [activeTab, setActiveTab] = useState('today'); // 'today', 'all', 'clients'
            const [schedule, setSchedule] = useState([]);
            const [clients, setClients] = useState([]);
            const [services, setServices] = useState([]);
            const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

            useEffect(() => {
                if (!db || !currentUser) return;
                // Fetch all schedule items assigned to this walker
                const scheduleQuery = query(collection(db, `artifacts/${appId}/public/data/schedule`), where("walkerId", "==", currentUser.id));
                const unsubSchedule = onSnapshot(scheduleQuery, (snap) => {
                    const sortedSchedule = snap.docs.map(d => ({id: d.id, ...d.data()}))
                        .sort((a, b) => new Date(b.date) - new Date(a.date) || a.time.localeCompare(b.time));
                    setSchedule(sortedSchedule);
                });

                // Fetch all clients and services. We will filter them on the client-side.
                const unsubClients = onSnapshot(collection(db, `artifacts/${appId}/public/data/clients`), (snap) => setClients(snap.docs.map(d => ({id: d.id, ...d.data()}))));
                const unsubServices = onSnapshot(collection(db, `artifacts/${appId}/public/data/services`), (snap) => setServices(snap.docs.map(d => ({id: d.id, ...d.data()}))));
                
                return () => { unsubSchedule(); unsubClients(); unsubServices(); };
            }, [db, currentUser]);

            // Memoize derived data to prevent recalculations on every render
            const walkerClients = React.useMemo(() => {
                if (!clients.length || !schedule.length) return [];
                const clientIds = new Set(schedule.map(s => s.clientId));
                return clients.filter(c => clientIds.has(c.id));
            }, [clients, schedule]);

            const tasksForDay = schedule.filter(entry => entry.date === selectedDate).sort((a,b) => a.time.localeCompare(b.time));
            const upcomingTasks = schedule.filter(s => new Date(s.date) >= new Date() && s.status !== 'Completed').sort((a,b) => new Date(a.date) - new Date(b.date));
            const pastTasks = schedule.filter(s => s.status === 'Completed').sort((a,b) => new Date(b.date) - new Date(a.date));


            const renderContent = () => {
                switch(activeTab) {
                    case 'today':
                        return (
                            <div>
                                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full p-3 border border-gray-300 bg-white rounded-lg mb-8 shadow-sm focus:ring-2 focus:ring-indigo-500" />
                                <div className="space-y-6">
                                    {tasksForDay.length > 0 ? tasksForDay.map(task => <WalkerViewTask key={task.id} task={task} db={db} clients={clients} services={services} alert={alert} />) : 
                                    <div className="text-center py-16 bg-white rounded-xl shadow-lg">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <h3 className="mt-2 text-lg font-medium text-gray-900">All Clear!</h3>
                                        <p className="mt-1 text-sm text-gray-500">You have no walks scheduled for this day.</p>
                                    </div>
                                    }
                                </div>
                            </div>
                        );
                    case 'all':
                        return (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Upcoming Appointments</h3>
                                    <div className="space-y-6">
                                        {upcomingTasks.length > 0 ? upcomingTasks.map(task => <WalkerViewTask key={task.id} task={task} db={db} clients={clients} services={services} alert={alert} />) : <div className="text-gray-500 bg-white p-6 rounded-xl shadow-lg text-center">No upcoming appointments.</div>}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-4 mt-8">Past Appointments</h3>
                                     <div className="space-y-6">
                                        {pastTasks.length > 0 ? pastTasks.map(task => <WalkerViewTask key={task.id} task={task} db={db} clients={clients} services={services} alert={alert} />) : <div className="text-gray-500 bg-white p-6 rounded-xl shadow-lg text-center">No past appointments.</div>}
                                    </div>
                                </div>
                            </div>
                        );
                    case 'clients':
                         return (
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-4">My Clients</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {walkerClients.length > 0 ? walkerClients.map(client => (
                                        <div key={client.id} className="bg-white p-6 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1">
                                            <p className="font-bold text-lg text-gray-800">{client.name}</p>
                                            <p className="text-gray-600">{client.contactInfo}</p>
                                            <div className="flex items-center text-sm text-gray-500 mt-3">
                                                <MapPinIcon className="w-4 h-4 mr-2" />
                                                {client.address || 'No address on file'}
                                            </div>
                                        </div>
                                    )) : <div className="text-gray-500 bg-white p-6 rounded-xl shadow-lg text-center col-span-full">You have not been assigned to any clients yet.</div>}
                                </div>
                            </div>
                        );
                    default: return null;
                }
            }

            return (
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-bold text-gray-900 mb-2">Walker Dashboard</h2>
                    <p className="text-gray-500 mb-8">Manage your schedule and complete your assigned walks.</p>
                    
                    <div className="mb-8 border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button onClick={() => setActiveTab('today')} className={`${activeTab === 'today' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-md capitalize transition-all duration-200`}>
                                Today's Schedule
                            </button>
                             <button onClick={() => setActiveTab('all')} className={`${activeTab === 'all' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-md capitalize transition-all duration-200`}>
                                All Appointments
                            </button>
                             <button onClick={() => setActiveTab('clients')} className={`${activeTab === 'clients' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-md capitalize transition-all duration-200`}>
                                My Clients
                            </button>
                        </nav>
                    </div>
                    
                    {renderContent()}
                </div>
            );
        };

        const WalkerViewTask = ({ task, db, clients, services, alert }) => {
            const [reportNotes, setReportNotes] = useState(task.reportCardNotes || '');
            const [didPoop, setDidPoop] = useState(task.didPoop || false);
            const [didPee, setDidPee] = useState(task.didPee || false);
            const [gpsPath, setGpsPath] = useState([]);
            const [gpsWatcherId, setGpsWatcherId] = useState(null);
            const [petDetails, setPetDetails] = useState(null);
            const [elapsedTime, setElapsedTime] = useState(0);
            
            const client = clients.find(c => c.id === task.clientId);
            const service = services.find(s => s.id === task.serviceId);

            useEffect(() => {
                if (db && task.clientId && task.petId) {
                    const petRef = doc(db, `artifacts/${appId}/public/data/clients/${task.clientId}/pets`, task.petId);
                    const unsub = onSnapshot(petRef, (doc) => {
                        setPetDetails(doc.data());
                    });
                    return () => unsub();
                }
            }, [db, task.clientId, task.petId]);

            useEffect(() => {
                let interval;
                if (task.status === 'Checked In') {
                    interval = setInterval(() => {
                        const now = new Date();
                        const checkedIn = new Date(task.checkInTime);
                        setElapsedTime(Math.floor((now - checkedIn) / 1000));
                    }, 1000);
                }
                return () => clearInterval(interval);
            }, [task.status, task.checkInTime]);

            const handleCheckIn = async () => {
                const taskRef = doc(db, `artifacts/${appId}/public/data/schedule`, task.id);
                await updateDoc(taskRef, { status: 'Checked In', checkInTime: new Date().toISOString() });
                
                if ('geolocation' in navigator) {
                    const watcher = navigator.geolocation.watchPosition(
                        (position) => setGpsPath(prev => [...prev, { lat: position.coords.latitude, lng: position.coords.longitude }]),
                        (error) => console.error("GPS Error:", error),
                        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                    );
                    setGpsWatcherId(watcher);
                }
                alert(`Checked in for ${petDetails?.name || 'the pet'}!`);
            };
            
            const handleCheckOut = async () => {
                if (gpsWatcherId) navigator.geolocation.clearWatch(gpsWatcherId);
                const taskRef = doc(db, `artifacts/${appId}/public/data/schedule`, task.id);
                await updateDoc(taskRef, {
                    status: 'Completed',
                    checkOutTime: new Date().toISOString(),
                    reportCardNotes: reportNotes,
                    didPoop,
                    didPee,
                    walkPathCoordinates: gpsPath
                });
                alert(`Walk complete! Report sent for ${petDetails?.name}.`);
            };

            const formatTime = (seconds) => {
                const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
                const secs = (seconds % 60).toString().padStart(2, '0');
                return `${mins}:${secs}`;
            }

            const statusStyles = {
                'Scheduled': { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
                'Checked In': { border: 'border-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' },
                'Completed': { border: 'border-green-500', bg: 'bg-green-50', text: 'text-green-700' },
            };
            const currentStatus = statusStyles[task.status] || { border: 'border-gray-300', bg: 'bg-gray-50', text: 'text-gray-700' };

            if (!client || !service) return null;

            return (
                <div className={`bg-white p-6 rounded-xl shadow-lg border-l-8 ${currentStatus.border} transition-all duration-300`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold text-2xl text-gray-800">{task.time}</p>
                            <p className="text-gray-600">{service.name}</p>
                        </div>
                        <div className={`px-3 py-1 text-sm font-semibold rounded-full ${currentStatus.bg} ${currentStatus.text}`}>
                            {task.status}
                        </div>
                    </div>
                    <div className="mt-4 border-t border-gray-200 pt-4 space-y-3">
                        <p><strong className="font-medium text-gray-700">Client:</strong> {client.name}</p>
                        <p><strong className="font-medium text-gray-700">Pet:</strong> {petDetails?.name || 'Loading...'} ({petDetails?.type})</p>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center text-gray-600"><MapPinIcon className="w-5 h-5 mr-2" /><p><strong>Address:</strong> {client.address || 'N/A'}</p></div>
                            <div className="flex items-start text-gray-600 mt-2"><NoteIcon className="w-5 h-5 mr-2 mt-1 flex-shrink-0" /><p><strong>Notes:</strong> {task.notes || 'No special instructions.'}</p></div>
                        </div>
                    </div>
                    <div className="mt-6">
                        {task.status === 'Scheduled' && <button onClick={handleCheckIn} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-all duration-200 transform hover:scale-105">Check In & Start Walk</button>}
                        {task.status === 'Checked In' && (
                            <div className="space-y-6">
                                <div className="text-center p-4 bg-yellow-100 border-2 border-dashed border-yellow-400 rounded-lg">
                                    <p className="text-sm font-semibold text-yellow-800 animate-pulse">Walk in progress...</p>
                                    <p className="text-3xl font-mono font-bold text-yellow-900">{formatTime(elapsedTime)}</p>
                                    {gpsPath.length > 0 && <p className="text-xs text-yellow-700">(GPS Active: {gpsPath.length} points recorded)</p>}
                                </div>
                                <div>
                                    <label className="block text-md font-semibold text-gray-700 mb-2">Potty Report</label>
                                    <div className="flex items-center justify-center space-x-4">
                                        <button onClick={() => setDidPee(!didPee)} className={`p-4 rounded-full text-4xl transition-all duration-200 relative ${didPee ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-gray-100'}`}>
                                            💧 {didPee && <CheckIcon className="w-6 h-6 text-white bg-blue-500 rounded-full absolute -top-1 -right-1" />}
                                        </button>
                                        <button onClick={() => setDidPoop(!didPoop)} className={`p-4 rounded-full text-4xl transition-all duration-200 relative ${didPoop ? 'bg-amber-100 ring-2 ring-amber-500' : 'bg-gray-100'}`}>
                                            💩 {didPoop && <CheckIcon className="w-6 h-6 text-white bg-amber-500 rounded-full absolute -top-1 -right-1" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor={`notes-${task.id}`} className="block text-md font-semibold text-gray-700 mb-2">Visit Notes</label>
                                    <textarea id={`notes-${task.id}`} value={reportNotes} onChange={e => setReportNotes(e.target.value)} maxLength="300" placeholder="How did the visit go?" rows="4" className="w-full p-3 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500"></textarea>
                                    <p className="text-right text-sm text-gray-500">{300 - reportNotes.length} characters remaining</p>
                                </div>
                                <button onClick={handleCheckOut} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold shadow-md hover:bg-green-700 transition-all duration-200 transform hover:scale-105">Check Out & Submit Report</button>
                            </div>
                        )}
                        {task.status === 'Completed' && <div className="text-center p-4 bg-green-100 text-green-800 font-semibold rounded-lg border border-green-300">Walk Completed!</div>}
                    </div>
                </div>
            );
        };

        const ReportCardModal = ({ report, onClose }) => {
            const renderWalkPath = () => {
                if (!report.walkPathCoordinates || report.walkPathCoordinates.length < 2) {
                    return <p className="text-gray-500 text-center py-8">No GPS data recorded for this walk.</p>;
                }
                
                const coords = report.walkPathCoordinates;
                const lats = coords.map(p => p.lat);
                const lngs = coords.map(p => p.lng);

                const minLat = Math.min(...lats);
                const maxLat = Math.max(...lats);
                const minLng = Math.min(...lngs);
                const maxLng = Math.max(...lngs);

                const latRange = maxLat - minLat || 1;
                const lngRange = maxLng - minLng || 1;

                const width = 400;
                const height = 250;
                const padding = 20;

                const points = coords.map(p => {
                    const x = ((p.lng - minLng) / lngRange) * (width - 2 * padding) + padding;
                    const y = ((maxLat - p.lat) / latRange) * (height - 2 * padding) + padding;
                    return `${x},${y}`;
                }).join(' ');

                return (
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto rounded-lg bg-gray-50 border border-gray-200">
                        <polyline points={points} fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx={points.split(' ')[0].split(',')[0]} cy={points.split(' ')[0].split(',')[1]} r="4" fill="#10b981" />
                        <circle cx={points.split(' ').slice(-1)[0].split(',')[0]} cy={points.split(' ').slice(-1)[0].split(',')[1]} r="4" fill="#ef4444" />
                    </svg>
                );
            };

            return (
                <CustomModal onClose={onClose}>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Visit Report for {report.petName}</h2>
                    <p className="text-gray-500 mb-4">{report.date} @ {report.time} - {report.serviceName}</p>
                    
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Walk Path</h4>
                            {renderWalkPath()}
                             <div className="flex justify-between text-xs mt-1 px-1">
                                 <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span> Start</div>
                                 <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-1"></span> End</div>
                             </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Potty Report</h4>
                            <div className="flex items-center space-x-4 bg-gray-50 p-3 rounded-lg">
                                <span className={`flex items-center text-lg ${report.didPee ? 'text-blue-600' : 'text-gray-400'}`}>
                                    <span className="text-2xl mr-2">💧</span> {report.didPee ? 'Pee' : 'No Pee'}
                                </span>
                                <span className={`flex items-center text-lg ${report.didPoop ? 'text-amber-600' : 'text-gray-400'}`}>
                                    <span className="text-2xl mr-2">💩</span> {report.didPoop ? 'Poop' : 'No Poop'}
                                </span>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Walker's Notes</h4>
                            <p className="bg-gray-50 p-3 rounded-lg text-gray-600 italic">
                                {report.reportCardNotes || "No notes were left for this visit."}
                            </p>
                        </div>
                    </div>
                     <button
                        onClick={onClose}
                        className="mt-6 w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                    >
                        Close Report
                    </button>
                </CustomModal>
            );
        };


        // --- Main Application ---
        function App() {
            const [db, setDb] = useState(null);
            const [isAuthReady, setIsAuthReady] = useState(false);
            const [loading, setLoading] = useState(true);
            const [currentUser, setCurrentUser] = useState(null);
            const [alertContent, setAlertContent] = useState(null);
            
            const alert = (message) => setAlertContent(message);
            
            useEffect(() => {
                try {
                    const app = initializeApp(firebaseConfig);
                    const firestore = getFirestore(app);
                    setDb(firestore);
                    const auth = getAuth(app);
                    onAuthStateChanged(auth, async (user) => {
                        if (!user) {
                            try {
                                // Sign in anonymously if no user is logged in
                                initialAuthToken ? await signInWithCustomToken(auth, initialAuthToken) : await signInAnonymously(auth);
                            } catch (error) { 
                                console.error("Anonymous Auth failed:", error); 
                                // If anonymous auth fails, allow the login page to be shown
                                setLoading(false); 
                                return;
                            }
                        }
                        setIsAuthReady(true);
                        setLoading(false);
                    });
                } catch (error) { 
                    console.error("Firebase init failed:", error); 
                    setLoading(false); 
                }
            }, []);

            const handleLogin = async (username, password) => {
                if (!db) return alert("Database not connected.");
                const normalizedUsername = username.toLowerCase();
                
                // Direct bypass for the default admin credentials for ease of access
                if (normalizedUsername === 'admin' && password === 'r5JQEIDVLSEvSIkuIbjv') {
                    const adminDocRef = doc(db, `artifacts/${appId}/public/data/admins`, 'admin');
                    const adminDoc = await getDoc(adminDocRef);
                    if (!adminDoc.exists()) {
                        // If admin account doesn't exist, create it with the hashed password
                        const hashedPassword = await hashPassword('r5JQEIDVLSEvSIkuIbjv');
                        await setDoc(adminDocRef, { username: 'admin', passwordHash: hashedPassword });
                        alert("Primary admin account created. Please log in again with 'admin' and the default password.");
                        return;
                    }
                    // If admin account already exists, and credentials match hardcoded, log in
                    setCurrentUser({ id: 'admin', name: 'Admin', username: 'admin', role: 'admin' });
                    return;
                }

                // Attempt to log in as existing admin, walker, or client from Firestore
                for (const type of ['admins', 'walkers', 'clients']) {
                    const q = query(collection(db, `artifacts/${appId}/public/data/${type}`), where("username", "==", normalizedUsername));
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        const userDoc = querySnapshot.docs[0];
                        const userData = userDoc.data();
                        if (await hashPassword(password) === userData.passwordHash) {
                            setCurrentUser({ id: userDoc.id, name: userData.name || userData.username, username: userData.username, role: type.slice(0, -1) });
                            return;
                        }
                    }
                }
                alert("Invalid username or password.");
            };

            const handleLogout = () => setCurrentUser(null);
            
            const handleSchedule = async (scheduleData) => {
                if (!db) return alert("Database not connected.");
                const { isRecurring, recurrencePattern, recurrenceEndDate, ...baseEntryData } = scheduleData;
                const scheduleCollectionRef = collection(db, `artifacts/${appId}/public/data/schedule`);
                const batch = writeBatch(db);
                const baseEntry = { ...baseEntryData, status: 'Scheduled', checkInTime: null, checkOutTime: null, photos: [], walkPathCoordinates: [], reportCardNotes: '', didPoop: false, didPee: false };

                if (!isRecurring) {
                    batch.set(doc(scheduleCollectionRef), baseEntry);
                } else {
                    if (!recurrencePattern || !recurrenceEndDate) return alert("Recurring appointments need a pattern and end date.");
                    let currentDate = new Date(baseEntry.date + 'T00:00:00');
                    const endDate = new Date(recurrenceEndDate + 'T00:00:00');
                    while (currentDate <= endDate) {
                        const dayOfWeek = currentDate.getDay();
                        const shouldAdd = (recurrencePattern === 'daily') || (recurrencePattern === 'weekly' && dayOfWeek === new Date(baseEntry.date + 'T00:00:00').getDay()) || (recurrencePattern === 'mon-wed-fri' && [1, 3, 5].includes(dayOfWeek));
                        if (shouldAdd) {
                            batch.set(doc(scheduleCollectionRef), { ...baseEntry, date: currentDate.toISOString().split('T')[0] });
                        }
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                }
                await batch.commit();
                alert("Service successfully scheduled!");
            };

            const renderDashboard = () => {
                // Only render dashboard if auth is ready AND currentUser is set
                if (isAuthReady && currentUser) {
                    switch (currentUser.role) {
                        case 'admin': return <AdminDashboard db={db} alert={alert} onSchedule={handleSchedule} />;
                        case 'walker': return <WalkerDashboard db={db} currentUser={currentUser} alert={alert} />;
                        case 'client': return <ClientDashboard db={db} currentUser={currentUser} alert={alert} onSchedule={handleSchedule} />;
                        default: return <LoginPage onLogin={handleLogin} alert={alert} />; // Fallback, though should be caught by !currentUser
                    }
                }
                return <LoginPage onLogin={handleLogin} alert={alert} />; // Show login if not authenticated or auth not ready
            };

            // Show loading spinner until Firebase Auth state is determined
            if (loading || !isAuthReady) return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-indigo-600"></div></div>;
            
            // If auth is ready but no user is logged in, show login page
            if (!currentUser) return <LoginPage onLogin={handleLogin} alert={alert} />;

            // Otherwise, render the main application with header and dashboard
            return (
                <div className="min-h-screen bg-gray-100 font-sans">
                    {alertContent && <CustomAlert message={alertContent} onClose={() => setAlertContent(null)} />}
                    <header className="bg-white shadow-md sticky top-0 z-40">
                        <div className="max-w-screen-xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                            <img src={LOGO_URL} alt="Leashed Logo" className="h-10" />
                            <div className="flex items-center">
                                <span className="text-gray-600 hidden sm:block">Welcome, <span className="font-semibold text-indigo-600">{currentUser.name}</span> <span className="text-gray-400">({currentUser.role})</span></span>
                                <button onClick={handleLogout} className="ml-6 text-sm font-medium text-red-600 hover:text-red-800 transition-colors flex items-center">
                                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                                    Logout
                                </button>
                            </div>
                        </div>
                    </header>
                    <main>
                        <div className="max-w-screen-xl mx-auto py-8 sm:px-6 lg:px-8">
                            {renderDashboard()}
                        </div>
                    </main>
                </div>
            );
        };
        
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(App));
    </script>
</body>
</html>
