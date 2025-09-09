import React, { useState } from 'react';
import { Lendie } from '../types';

interface EditLendieFormProps {
  lendieToEdit: Lendie;
  onUpdateLendie: (lendieData: Pick<Lendie, 'name' | 'mobile' | 'address' | 'photo'>) => void;
  onClose: () => void;
}

export const EditLendieForm: React.FC<EditLendieFormProps> = ({ lendieToEdit, onUpdateLendie, onClose }) => {
    const [name, setName] = useState(lendieToEdit.name);
    const [mobile, setMobile] = useState(lendieToEdit.mobile);
    const [address, setAddress] = useState(lendieToEdit.address || '');
    const [photo, setPhoto] = useState<string | undefined>(lendieToEdit.photo);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setPhoto(event.target?.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!name || !mobile) {
            alert('Please fill all required fields');
            return;
        }

        const updatedData = { name, mobile, address, photo };
        onUpdateLendie(updatedData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-600 border-b pb-2">Lendie Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Name*" value={name} onChange={e => setName(e.target.value)} className="p-2 border rounded" required />
                <input type="text" placeholder="Mobile Number*" value={mobile} onChange={e => setMobile(e.target.value)} className="p-2 border rounded" required />
            </div>
            <textarea placeholder="Address (Optional)" value={address} onChange={e => setAddress(e.target.value)} className="p-2 border rounded w-full" />
            <div>
                <label className="block text-sm font-medium text-slate-700">Photo (Optional)</label>
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"/>
            </div>
            {photo && <img src={photo} alt="Preview" className="w-24 h-24 rounded-full object-cover mx-auto" />}
            
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-md text-slate-800 hover:bg-slate-300">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-primary rounded-md text-white hover:bg-sky-600">Update Lendie</button>
            </div>
        </form>
    );
};
