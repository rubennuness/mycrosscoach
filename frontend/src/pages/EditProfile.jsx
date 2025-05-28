// src/pages/EditProfile.jsx
import React, { useState } from 'react';
import { useNavigate }   from 'react-router-dom';
import BackButton        from '../components/BackButton';
import './EditProfile.css';

export default function EditProfile() {
  const navigate = useNavigate();
  const stored   = JSON.parse(localStorage.getItem('user')) || {};

  /* estado (pré-preenchido) */
  const [form, setForm] = useState({
    name  : stored.name  || '',
    username : stored.username || '',
    gender: stored.gender   || '',
    phone : stored.phone    || '',
    email : stored.email    || '',
    avatar_url: stored.avatar_url || ''
  });

  
  /* altera qualquer campo */
  const handle = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /* grava – exemplo PUT /users/:id  */
  const save = async e => {
    e.preventDefault();
    try{
        const body = Object.fromEntries(
  Object.entries(form).filter(([_, v]) => v !== '')
);
      await fetch(
        `https://mycrosscoach-production.up.railway.app/api/users/${stored.id}`,
        { method : 'PUT',
          headers: { 'Content-Type':'application/json' },
          body   : JSON.stringify(body) }
      );
      /* actualiza cache local e volta atrás */
      localStorage.setItem('user', JSON.stringify({ ...stored, ...form }));
      navigate(-1);
    }catch{
      alert('Erro ao guardar');
    }
  };

  /* carrega imagem local e converte para URL-Base64 */
 const pickAvatar = e =>{
   const file = e.target.files?.[0];
   if(!file) return;
   const reader = new FileReader();
   reader.onload = ev => setForm(f=>({...f,avatar_url: ev.target.result}));
   reader.readAsDataURL(file);          /* ← gera data:image/...;base64, */
 };
  return (
    <div className="edit-wrapper">
      <BackButton />
      <h1>Edit Profile</h1>

      <form className="edit-form" onSubmit={save}>
        <label>
          Name
          <input
            name="name"
            value={form.name}
            onChange={handle}
            required
          />
        </label>

        <label>
          Username
          <input name="username"
         value={form.username}
            onChange={handle}
          />
        </label>

        <label>
          Gender
          <select
            name="gender"
            value={form.gender}
            onChange={handle}
          >
            <option value="">–</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </label>

        <label>
          Phone Number
          <input
            name="phone"
            value={form.phone}
            onChange={handle}
            placeholder="+44 123 456 789"
          />
        </label>

        <label>
          Email
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handle}
            required
          />
        </label>
        <label className="avatar-field">
        Avatar
        <input type="file" accept="image/*" onChange={pickAvatar}/>
        </label>
        {form.avatar_url && (
        <img className="avatar-preview" src={form.avatar_url} alt="preview"/>
        )}
        <button className="btn-save">Save</button>
      </form>
    </div>
  );
}
