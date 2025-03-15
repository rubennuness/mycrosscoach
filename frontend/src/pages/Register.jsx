// src/pages/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import './Register.css';

function Register() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const [serverError, setServerError] = useState('');
  const passwordValue = watch('password', '');

  const onSubmit = async (formData) => {
    try {
      setServerError('');

      const response = await fetch('http://192.168.56.105:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao criar conta');
      }

      navigate('/login');

    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <div className="register-split-container">
      {/* Lado esquerdo: formulário */}
      <div className="register-left">
        <div className="register-left-content">
          <h2>MyCrossCoach</h2>
          <h3>Criar Conta</h3>
          <p>Preencha os campos para se juntar ao MyCrossCoach</p>

          {serverError && <p className="error-message">{serverError}</p>}

          <form onSubmit={handleSubmit(onSubmit)} className="register-form">
            {/* Nome */}
            <div className="form-group">
              <label>Nome:</label>
              <input
                type="text"
                placeholder="Seu nome"
                {...register('name', { required: 'O nome é obrigatório' })}
              />
              {errors.name && (
                <p className="field-error">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                placeholder="exemplo@dominio.com"
                {...register('email', {
                  required: 'O email é obrigatório',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Formato de email inválido'
                  }
                })}
              />
              {errors.email && (
                <p className="field-error">{errors.email.message}</p>
              )}
            </div>

            {/* Senha */}
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                placeholder="********"
                {...register('password', {
                  required: 'A senha é obrigatória',
                  minLength: {
                    value: 6,
                    message: 'A senha deve ter pelo menos 6 caracteres'
                  },
                  pattern: {
                    value: /^(?=.*[0-9])(?=.*[A-Za-z]).{6,}$/,
                    message: 'A senha deve conter pelo menos uma letra e um número'
                  }
                })}
              />
              {errors.password && (
                <p className="field-error">{errors.password.message}</p>
              )}
            </div>

            {/* Confirmar Senha */}
            <div className="form-group">
              <label>Confirme Password:</label>
              <input
                type="password"
                placeholder="********"
                {...register('confirmPassword', {
                  required: 'Por favor confirme a senha',
                  validate: (value) =>
                    value === passwordValue || 'As senhas não correspondem'
                })}
              />
              {errors.confirmPassword && (
                <p className="field-error">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Role: Coach/Atleta */}
            <div className="form-group">
              <label>Você é:</label>
              <select
                {...register('role', { required: 'Escolha se é Treinador ou Atleta' })}
              >
                <option value="">-- Select --</option>
                <option value="coach">Treinador</option>
                <option value="athlete">Atleta</option>
              </select>
              {errors.role && (
                <p className="field-error">{errors.role.message}</p>
              )}
            </div>

            <button type="submit" className="btn-register">Registar</button>
          </form>

          <div className="register-footer">
            <span>Já tem conta?</span>
            <Link to="/login" className="login-link">Fazer Login</Link>
          </div>
        </div>
      </div>

      {/* Lado direito: imagem de fundo */}
      <div className="register-right">
        {/* Imagem / overlay definidos em Register.css */}
      </div>
    </div>
  );
}

export default Register;
