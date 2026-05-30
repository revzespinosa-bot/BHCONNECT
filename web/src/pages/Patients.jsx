import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const emptyForm = {
  firstName: '',
  lastName: '',
  phone: '',
  address: '',
  barangay: 'Barangay San Jose',
  gender: 'male',
};

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const load = () => {
    api.getPatients(search).then(setPatients).catch((err) => setError(err.message));
  };

  useEffect(() => {
    load();
  }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createPatient(form);
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Unified Patient Registry</h2>
          <p>Search and manage patient records</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Patient'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <form className="card form-card" onSubmit={handleCreate}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Address</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Barangay</label>
              <input value={form.barangay} onChange={(e) => setForm({ ...form, barangay: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Save Patient</button>
        </form>
      )}

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Search by name, code, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Barangay</th>
              <th>Gender</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id}>
                <td><code>{p.patient_code}</code></td>
                <td>{p.first_name} {p.last_name}</td>
                <td>{p.phone || '-'}</td>
                <td>{p.barangay || '-'}</td>
                <td>{p.gender || '-'}</td>
                <td><Link to={`/patients/${p.id}`} className="btn btn-sm">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
