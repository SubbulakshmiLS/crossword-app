import React from 'react';
import './StudentForm.css';

export interface StudentInfo {
  name: string;
  className: string;
  school: string;
}

interface StudentFormProps {
  onStart: (info: StudentInfo) => void;
}

export function StudentForm({ onStart }: StudentFormProps) {
  const [form, setForm] = React.useState<StudentInfo>({ name: '', className: '', school: '' });
  const [errors, setErrors] = React.useState<Partial<StudentInfo>>({});

  const validate = () => {
    const e: Partial<StudentInfo> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.className.trim()) e.className = 'Class is required';
    if (!form.school.trim()) e.school = 'School name is required';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onStart(form);
  };

  const handleChange = (field: keyof StudentInfo, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  return (
    <div className="student-form-overlay">
      <div className="student-form-card fade-in">
        <div className="student-form-icon">⚗️</div>
        <h1 className="student-form-title">Chemistry Crossword</h1>
        <p className="student-form-subtitle">Enter your details to begin the puzzle</p>

        <form onSubmit={handleSubmit} className="student-form" noValidate>
          <div className={`form-field ${errors.name ? 'has-error' : ''}`}>
            <label htmlFor="student-name">Full Name</label>
            <input
              id="student-name"
              type="text"
              placeholder="e.g. Arjun Kumar"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              autoFocus
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className={`form-field ${errors.className ? 'has-error' : ''}`}>
            <label htmlFor="student-class">Class / Section</label>
            <input
              id="student-class"
              type="text"
              placeholder="e.g. 11-A or 12th Science"
              value={form.className}
              onChange={e => handleChange('className', e.target.value)}
            />
            {errors.className && <span className="field-error">{errors.className}</span>}
          </div>

          <div className={`form-field ${errors.school ? 'has-error' : ''}`}>
            <label htmlFor="student-school">School Name</label>
            <input
              id="student-school"
              type="text"
              placeholder="e.g. Delhi Public School"
              value={form.school}
              onChange={e => handleChange('school', e.target.value)}
            />
            {errors.school && <span className="field-error">{errors.school}</span>}
          </div>

          <button type="submit" className="btn-start">
            Start Puzzle →
          </button>
        </form>
      </div>
    </div>
  );
}
