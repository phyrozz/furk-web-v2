import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import ResizableRightSidebar from '../../common/ResizableRightSidebar';
import Button from '../../common/Button';
import { UserProfileService } from '../../../services/profile/user-profile-service';
import { ToastService } from '../../../services/toast/toast-service';
import PawLoading from '../../common/PawLoading';
import { UserProfile } from './ProfilePage';
import Select from '../../common/Select';
import DateInput from '../../common/DateInput';

import FileUploadField, { UploadedFile } from '../../common/FileUploadField';
import { S3UploadService } from '../../../services/s3-upload/s3-upload-service';
import Switch from '../../common/Switch';
import { checkImage } from '../../../utils/s3-file-utils';
import { motion } from 'framer-motion';

export interface PetProfile {
    id: string;
    name: string;
    species: string;
    breed: string;
    sex: string;
    birth_date: string;
    weight_kg: number;
    color: string;
    is_neutered: boolean;
    notes: string;
    profile_image: string;
    user: UserProfile[];
    created_by: string;
    created_at: string;
    modified_by: string;
    modified_at: string;
}

const PetProfiles = () => {
    const [pets, setPets] = useState<PetProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [editingPet, setEditingPet] = useState<PetProfile | null>(null);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [petImage, setPetImage] = useState<UploadedFile | null>(null);
    const [selectedImage, setSelectedImage] = useState<string>("");
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<PetProfile>>({
        name: '',
        species: '',
        breed: '',
        sex: '',
        birth_date: '',
        weight_kg: 0,
        color: '',
        is_neutered: false,
        notes: '',
        profile_image: ''
    });

    const SEX_OPTIONS: any[] = [
      { id: 1, code: 'male', displayName: 'Male' },
      { id: 2, code: 'female', displayName: 'Female' }
    ];

    const dataService = new UserProfileService();
    const uploadService = new S3UploadService();

    useEffect(() => {
        loadPets();
    }, []);

    const loadPets = async () => {
        try {
            const response = await dataService.listPetProfiles(100, 0);
            setPets(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching pets:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingSubmit(true);
        try {
            if (editingPet) {
                await dataService.updatePetProfile({ ...editingPet, ...formData } as PetProfile);
                ToastService.show('Pet profile updated successfully');
            } else {
                if (!petImage) {
                    ToastService.show('Please upload a pet image');
                    return;
                }

                const uniqueFileName = uploadService.generateUniqueFileName(petImage.file.name);
                const key = `pet-images/${uniqueFileName}`;
                const s3_key = await uploadService.uploadFile(petImage.file, key);

                if (!s3_key) {
                    ToastService.show('Error uploading pet image');
                    return;
                }

                // Do not insert anything on the db until the compressed image is finally ready
                const imageReady = await checkImage(s3_key);
                if (!imageReady) {
                    ToastService.show('Error uploading pet image');
                    return;
                }

                await dataService.addPetProfile({...formData, profile_image: s3_key} as PetProfile);
                ToastService.show('Pet profile added successfully');
            }
            setIsSidebarOpen(false);
            setEditingPet(null);
            setLoadingSubmit(false);
            setPetImage(null);
            setFormData({
                name: '',
                species: '',
                breed: '',
                sex: '',
                birth_date: '',
                weight_kg: 0,
                color: '',
                is_neutered: false,
                notes: '',
                profile_image: ''
            });
            loadPets();
        } catch (error: any) {
            if (error?.response?.data?.error) {
                ToastService.show(error.response.data.error);
            } else {
                ToastService.show('Error saving pet profile');
            }
            setLoadingSubmit(false);
        }
    };

    const handleDelete = async (petId: string) => {
        if (window.confirm('Are you sure you want to remove this pet?')) {
            try {
                await dataService.deletePetProfile(petId);
                ToastService.show('Pet profile deleted successfully');
                loadPets();
            } catch (error: any) {
                if (error?.response?.data?.error) {
                    ToastService.show(error.response.data.error);
                } else {
                    ToastService.show('Error deleting pet profile');
                }
            }
        }
    };

    const handleEdit = (pet: PetProfile) => {
        setEditingPet(pet);
        setFormData({
            name: pet.name,
            species: pet.species,
            breed: pet.breed,
            sex: pet.sex,
            birth_date: pet.birth_date,
            weight_kg: pet.weight_kg,
            color: pet.color,
            is_neutered: pet.is_neutered,
            notes: pet.notes,
            profile_image: pet.profile_image
        });
        setIsSidebarOpen(true);
    };

    if (loading) {
        return (
            <div className="w-full h-full flex justify-center items-center">
                <PawLoading />
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-hidden cursor-default">
            <div className="flex justify-between items-center px-6 pt-4">
                <h2 className="text-xl font-cursive font-semibold text-gray-800">My Pets</h2>
                <Button
                    variant="primary"
                    icon={<Plus size={18} />}
                    onClick={() => {
                        setEditingPet(null);
                        setFormData({
                            name: '',
                            species: '',
                            breed: '',
                            sex: '',
                            birth_date: '',
                            weight_kg: 0,
                            color: '',
                            is_neutered: false,
                            notes: '',
                            profile_image: ''
                        });
                        setIsSidebarOpen(true);
                    }}
                >
                    Add Pet
                </Button>
            </div>

            <div className="h-[calc(100%-4rem)] overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pets.map((pet) => (
                        <div key={pet.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                            <div className="flex justify-between items-start">
                                <div className="flex items-start space-x-4">
                                    <img 
                                        src={pet.profile_image} 
                                        alt={`${pet.name}'s profile`}
                                        className="w-16 h-16 rounded-full object-cover cursor-pointer"
                                        onClick={() => {
                                            setSelectedImage(pet.profile_image);
                                            setImageModalOpen(true);
                                        }}
                                    />
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">{pet.name}</h3>
                                        <p className="text-sm text-gray-600">{pet.species} • {pet.breed}</p>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(pet)}
                                        className="text-gray-600 hover:text-primary-600"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(pet.id)}
                                        className="text-gray-600 hover:text-red-600"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            {/* <div className="space-y-2 text-sm text-gray-600">
                                <p>Sex: {pet.sex}</p>
                                <p>Birth Date: {pet.birth_date ? DateUtils.formatDateStringFromTimestamp(pet.birth_date) : 'N/A'}</p>
                                <p>Weight: {pet.weight_kg} kg</p>
                                <p>Color: {pet.color}</p>
                                <p>Neutered: {pet.is_neutered ? 'Yes' : 'No'}</p>
                                {pet.notes && <p>Notes: {pet.notes}</p>}
                            </div> */}
                        </div>
                    ))}
                </div>
            </div>

            {imageModalOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                    onClick={() => setImageModalOpen(false)}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={selectedImage}
                            alt="Pet profile"
                            className="max-h-[80vh] max-w-[90vw] rounded-lg"
                        />
                        <button
                            onClick={() => setImageModalOpen(false)}
                            className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-1 hover:bg-opacity-75"
                        >
                            <X size={24} />
                        </button>
                    </motion.div>
                </motion.div>
            )}

            <ResizableRightSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                title={editingPet ? 'Edit Pet' : 'Add New Pet'}
            >
                <form onSubmit={handleSubmit} className="p-6">
                    {!editingPet && <div className="flex justify-stretch w-full items-center pb-6">
                        <FileUploadField
                            label="Pet Image"
                            required
                            accept="image/*"
                            maxSizeMB={5}
                            maxFiles={1}
                            files={petImage ? [petImage] : []}
                            onFilesChange={(files) => setPetImage(files[0])}
                            helperText="Upload an image (PNG, JPG, JPEG)"
                        />
                    </div>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Name
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                disabled={editingPet ? true : false}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Species
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.species}
                                onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                disabled={editingPet ? true : false}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Breed
                            </label>
                            <input
                                type="text"
                                value={formData.breed}
                                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sex
                            </label>
                            <Select
                                options={SEX_OPTIONS}
                                value={SEX_OPTIONS.find((s) => s.code === formData.sex) || null}
                                onChange={(e) => setFormData({ ...formData, sex: e?.code })}
                                getOptionLabel={(m) => m.displayName}
                                placeholder="Select sex"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Birth Date
                            </label>
                            <DateInput
                                value={formData.birth_date ? new Date(formData.birth_date) : null}
                                max={new Date()}
                                onChange={(date) => setFormData({ ...formData, birth_date: date ? date.toISOString().split('T')[0] : ''})}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Weight (kg)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={formData.weight_kg}
                                onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Color
                            </label>
                            <input
                                type="text"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div className="flex gap-2 justify-start items-center">
                            <Switch
                                isOn={formData.is_neutered ? true : false}
                                handleToggle={() => setFormData({ ...formData, is_neutered: !formData.is_neutered })}
                            />
                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">    
                                <span>Neutered</span>
                            </label>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                rows={3}
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3 sticky bottom-0 bg-white py-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            icon={<Save size={18} />}
                            loading={loadingSubmit}
                        >
                            {editingPet ? 'Update' : 'Save'}
                        </Button>
                    </div>
                </form>
            </ResizableRightSidebar>
        </div>
    );
};

export default PetProfiles;