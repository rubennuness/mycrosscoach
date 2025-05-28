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
  const [avatarFile, setAvatarFile] = useState(null);

  
  /* altera qualquer campo */
  const handle = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /* grava – exemplo PUT /users/:id  */
  const save = async e => {
    e.preventDefault();
    try{
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k,v));
      if (avatarFile) fd.append('avatar', avatarFile);   // ficheiro mesmo!

      await fetch(`https://mycrosscoach-production.up.railway.app/api/users/${stored.id}`, {
        method : 'PUT',
        body   : fd          // **nunca definir Content-Type aqui**
      });
      /* actualiza cache local e volta atrás */
      localStorage.setItem(
        'user',
        JSON.stringify({
          ...stored,
          ...form,
          ...(avatarFile && { avatar_url: form.avatar_url })
        })
      );
      navigate(-1);
    }catch{
      alert('Erro ao guardar');
    }
  };

  /* carrega imagem local e converte para URL-Base64 */
 const pickAvatar = e =>{
   const file = e.target.files?.[0];
   if(!file) return;
   setAvatarFile(file);
   // preview imediato
   setForm(f => ({...f, avatar_url: URL.createObjectURL(file)}));
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
