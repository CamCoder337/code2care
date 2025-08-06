"use client"

import type React from "react"
import {useState} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Textarea} from "@/components/ui/textarea"
import {DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {Globe, Mail, MapPin, Phone, User} from "lucide-react"

interface AddPatientFormProps {
    onSubmit: (patient: any) => void
    onCancel: () => void
}

export function AddPatientForm({onSubmit, onCancel}: AddPatientFormProps) {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        email: "",
        preferredLanguage: "",
        gender: "",
        dateOfBirth: "",
        address: "",
        emergencyContact: "",
        medicalHistory: "",
        preferredContactMethod: "phone",
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const newPatient = {
            id: `PAT${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
            name: `${formData.firstName} ${formData.lastName}`,
            avatar: `${formData.firstName[0]}${formData.lastName[0]}`,
            ...formData,
            lastVisit: new Date().toISOString().split("T")[0],
            status: "active",
        }
        onSubmit(newPatient)
    }

    return (
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                    <User className="w-5 h-5 text-primary-500"/>
                    Add New Patient
                </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary-600">Personal Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name *</Label>
                            <Input
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                placeholder="Enter first name"
                                required
                                className="h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name *</Label>
                            <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                placeholder="Enter last name"
                                required
                                className="h-12"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                            <Input
                                id="dateOfBirth"
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                                required
                                className="h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gender">Gender</Label>
                            <Select value={formData.gender}
                                    onValueChange={(value) => setFormData({...formData, gender: value})}>
                                <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Select gender"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-secondary-600">Contact Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Phone Number *</Label>
                            <div className="relative">
                                <Phone
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"/>
                                <Input
                                    id="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                                    placeholder="+1234567890"
                                    required
                                    className="pl-10 h-12"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <Mail
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"/>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    placeholder="patient@email.com"
                                    className="pl-10 h-12"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="preferredLanguage">Preferred Language *</Label>
                            <div className="relative">
                                <Globe
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"/>
                                <Select
                                    value={formData.preferredLanguage}
                                    onValueChange={(value) => setFormData({...formData, preferredLanguage: value})}
                                >
                                    <SelectTrigger className="pl-10 h-12">
                                        <SelectValue placeholder="Select language"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="English">English</SelectItem>
                                        <SelectItem value="Français">Français</SelectItem>
                                        <SelectItem value="Duala">Duala</SelectItem>
                                        <SelectItem value="Spanish">Spanish</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="preferredContactMethod">Preferred Contact Method</Label>
                            <Select
                                value={formData.preferredContactMethod}
                                onValueChange={(value) => setFormData({...formData, preferredContactMethod: value})}
                            >
                                <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Select contact method"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="phone">Phone</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="sms">SMS</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 text-muted-foreground w-4 h-4"/>
                            <Textarea
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                                placeholder="Enter full address"
                                className="pl-10 min-h-[80px]"
                            />
                        </div>
                    </div>
                </div>

                {/* Medical Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-accent-600">Medical Information</h3>
                    <div className="space-y-2">
                        <Label htmlFor="emergencyContact">Emergency Contact</Label>
                        <Input
                            id="emergencyContact"
                            value={formData.emergencyContact}
                            onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                            placeholder="Emergency contact name and phone"
                            className="h-12"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="medicalHistory">Medical History</Label>
                        <Textarea
                            id="medicalHistory"
                            value={formData.medicalHistory}
                            onChange={(e) => setFormData({...formData, medicalHistory: e.target.value})}
                            placeholder="Brief medical history, allergies, current medications..."
                            className="min-h-[100px]"
                        />
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-6">
                    <Button type="button" variant="outline" onClick={onCancel}
                            className="w-full sm:w-auto bg-transparent">
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        Add Patient
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    )
}
