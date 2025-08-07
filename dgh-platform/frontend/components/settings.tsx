"use client"

import type React from "react"
import {useEffect, useState} from "react"
import {Card, CardContent} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Avatar, AvatarFallback} from "@/components/ui/avatar"
import {Textarea} from "@/components/ui/textarea"
import {CalendarDays, Hash, Mail, MapPin, Phone, Save, Stethoscope, User, XCircle} from "lucide-react"

// Define a User type for consistency
interface UserData {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    department: string
    bio: string
    matricule: string
    gender: string
    dateOfBirth: string
    emergencyContact: string
    avatarUrl?: string
}

interface SettingsProps {
    user: UserData
    onUserUpdate: (updatedUser: UserData) => void
}

export function Settings({user, onUserUpdate}: SettingsProps) {
    const [profile, setProfile] = useState<UserData>(user)
    const [isEditing, setIsEditing] = useState(false)

    // Update local profile state when user prop changes (e.g., after login)
    useEffect(() => {
        setProfile(user)
    }, [user])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {id, value} = e.target
        setProfile((prev) => ({...prev, [id]: value}))
    }

    const handleSave = () => {
        // In a real application, you would send this data to a backend API
        console.log("Saving profile:", profile)
        onUserUpdate(profile) // Update the parent state
        setIsEditing(false)
        // Optionally show a toast notification for success
    }

    const handleCancel = () => {
        setProfile(user) // Revert to original user data
        setIsEditing(false)
    }

    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden">
            {/* Fixed container that prevents horizontal movement */}
            <div className="w-full h-full overflow-y-auto overflow-x-hidden">
                <div className="min-h-full w-full max-w-none">
                    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                        <div className="max-w-4xl mx-auto space-y-6">
                            {/* Header */}
                            <div
                                className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-start lg:space-y-0 lg:space-x-4">
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        Profile Settings
                                    </h1>
                                    <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base lg:text-lg">
                                        Manage your personal and professional information
                                    </p>
                                </div>
                                {!isEditing ? (
                                    <Button
                                        className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-2 text-sm sm:text-base"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2"/>
                                        Edit Profile
                                    </Button>
                                ) : (
                                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                        <Button
                                            variant="outline"
                                            className="px-4 py-2 text-sm sm:text-base"
                                            onClick={handleCancel}
                                        >
                                            <XCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2"/>
                                            Cancel
                                        </Button>
                                        <Button
                                            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-4 py-2 text-sm sm:text-base"
                                            onClick={handleSave}
                                        >
                                            <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2"/>
                                            Save Changes
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Profile Card */}
                            <Card
                                className="shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 w-full">
                                <CardContent className="p-4 sm:p-6 lg:p-8 space-y-6">
                                    <div className="flex flex-col items-center gap-4">
                                        <Avatar
                                            className="w-24 h-24 sm:w-32 sm:h-32 ring-4 ring-blue-500 ring-offset-4 ring-offset-white dark:ring-offset-gray-900">
                                            <AvatarFallback
                                                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-2xl sm:text-3xl font-bold">
                                                {profile.firstName ? profile.firstName[0].toUpperCase() : "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="text-center">
                                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                                                {profile.firstName} {profile.lastName}
                                            </h2>
                                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2 mt-1">
                                                <Stethoscope className="w-4 h-4"/>
                                                {profile.department}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
                                        {/* First Name (Read-only) */}
                                        <div className="space-y-2 w-full">
                                            <Label htmlFor="firstName" className="text-sm font-medium">First
                                                Name</Label>
                                            <div className="relative">
                                                <User
                                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
                                                <Input
                                                    id="firstName"
                                                    value={profile.firstName}
                                                    disabled={true}
                                                    className="pl-10 h-12 bg-gray-50 dark:bg-gray-800 w-full"
                                                />
                                            </div>
                                        </div>

                                        {/* Last Name (Read-only) */}
                                        <div className="space-y-2 w-full">
                                            <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                                            <div className="relative">
                                                <User
                                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
                                                <Input
                                                    id="lastName"
                                                    value={profile.lastName}
                                                    disabled={true}
                                                    className="pl-10 h-12 bg-gray-50 dark:bg-gray-800 w-full"
                                                />
                                            </div>
                                        </div>

                                        {/* Email Address (Read-only) */}
                                        <div className="space-y-2 w-full">
                                            <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                                            <div className="relative">
                                                <Mail
                                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={profile.email}
                                                    disabled={true}
                                                    className="pl-10 h-12 bg-gray-50 dark:bg-gray-800 w-full"
                                                />
                                            </div>
                                        </div>

                                        {/* Matricule (Read-only) */}
                                        <div className="space-y-2 w-full">
                                            <Label htmlFor="matricule" className="text-sm font-medium">Matricule</Label>
                                            <div className="relative">
                                                <Hash
                                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
                                                <Input
                                                    id="matricule"
                                                    value={profile.matricule}
                                                    disabled={true}
                                                    className="pl-10 h-12 bg-gray-50 dark:bg-gray-800 w-full"
                                                />
                                            </div>
                                        </div>

                                        {/* Gender (Read-only) */}
                                        <div className="space-y-2 w-full">
                                            <Label htmlFor="gender" className="text-sm font-medium">Gender</Label>
                                            <div className="relative">
                                                <User
                                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
                                                <Input
                                                    id="gender"
                                                    value={profile.gender}
                                                    disabled={true}
                                                    className="pl-10 h-12 bg-gray-50 dark:bg-gray-800 w-full"
                                                />
                                            </div>
                                        </div>

                                        {/* Date of Birth (Read-only) */}
                                        <div className="space-y-2 w-full">
                                            <Label htmlFor="dateOfBirth" className="text-sm font-medium">Date of
                                                Birth</Label>
                                            <div className="relative">
                                                <CalendarDays
                                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
                                                <Input
                                                    id="dateOfBirth"
                                                    type="date"
                                                    value={profile.dateOfBirth}
                                                    disabled={true}
                                                    className="pl-10 h-12 bg-gray-50 dark:bg-gray-800 w-full"
                                                />
                                            </div>
                                        </div>

                                        {/* Phone Number (Editable) */}
                                        <div className="space-y-2 w-full">
                                            <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                                            <div className="relative">
                                                <Phone
                                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
                                                <Input
                                                    id="phone"
                                                    value={profile.phone}
                                                    onChange={handleChange}
                                                    disabled={!isEditing}
                                                    className={`pl-10 h-12 w-full ${!isEditing ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                                                />
                                            </div>
                                        </div>

                                        {/* Department (Read-only) */}
                                        <div className="space-y-2 w-full">
                                            <Label htmlFor="department"
                                                   className="text-sm font-medium">Department</Label>
                                            <div className="relative">
                                                <Stethoscope
                                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
                                                <Input
                                                    id="department"
                                                    value={profile.department}
                                                    disabled={true}
                                                    className="pl-10 h-12 bg-gray-50 dark:bg-gray-800 w-full"
                                                />
                                            </div>
                                        </div>

                                        {/* Address (Editable) */}
                                        <div className="space-y-2 md:col-span-2 w-full">
                                            <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4"/>
                                                <Textarea
                                                    id="address"
                                                    value={profile.address}
                                                    onChange={handleChange}
                                                    disabled={!isEditing}
                                                    className={`pl-10 min-h-[80px] w-full resize-none ${!isEditing ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                                                />
                                            </div>
                                        </div>

                                        {/* Emergency Contact (Read-only) */}
                                        <div className="space-y-2 md:col-span-2 w-full">
                                            <Label htmlFor="emergencyContact" className="text-sm font-medium">Emergency
                                                Contact</Label>
                                            <Input
                                                id="emergencyContact"
                                                value={profile.emergencyContact}
                                                disabled={true}
                                                className="h-12 bg-gray-50 dark:bg-gray-800 w-full"
                                            />
                                        </div>

                                        {/* Biography (Read-only) */}
                                        <div className="space-y-2 md:col-span-2 w-full">
                                            <Label htmlFor="bio" className="text-sm font-medium">Biography</Label>
                                            <Textarea
                                                id="bio"
                                                value={profile.bio}
                                                disabled={true}
                                                className="min-h-[120px] bg-gray-50 dark:bg-gray-800 w-full resize-none"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
