"use client";

import { useState } from "react";
import {
  AlertCircle,
  Building,
  Camera,
  CheckCircle2,
  Globe,
  Mail,
  MapPin,
  User
} from "lucide-react";
import { cn } from "@/components/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UserProfileOverviewReference() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    window.setTimeout(() => setIsSaving(false), 1500);
  };

  return (
    <div className="account-reference-frame">
      <section className="account-reference-shell">
        <div className="account-reference-cover">
          <Button
            aria-label="Change cover"
            className="account-reference-cover-action"
            type="button"
          >
            <Camera className="h-4 w-4" />
            <span>Change Cover</span>
          </Button>
        </div>

        <div className="account-reference-body">
          <div className="account-reference-identity">
            <div className="account-reference-avatar-shell">
              <Button
                aria-label="Change avatar"
                className="account-reference-avatar"
                type="button"
                variant="ghost"
              >
                <span className="account-reference-avatar-initials">JD</span>
                <span className="account-reference-avatar-overlay">
                  <Camera className="h-8 w-8 text-white" />
                </span>
              </Button>
            </div>

            <div className="account-reference-identity-copy">
              <h2 className="account-reference-name">John Doe</h2>
              <p className="account-reference-subtitle">Sr. Full-Stack Engineer at Acme Corp</p>
            </div>

            <Button className="account-reference-public-button" type="button">
              View Public Profile
            </Button>
          </div>

          <div className="account-reference-grid">
            <div className="account-reference-main">
              <section className="account-reference-section">
                <h3 className="account-reference-section-title">Personal Information</h3>

                <div className="account-reference-fields account-reference-fields--two">
                  <div className="account-reference-field-group">
                    <Label
                      className="account-reference-label"
                      htmlFor="reference-first-name"
                    >
                      First Name
                    </Label>
                    <div className="account-reference-control-shell">
                      <User className="account-reference-control-icon" />
                      <Input
                        className="account-reference-input"
                        defaultValue="John"
                        id="reference-first-name"
                        type="text"
                      />
                    </div>
                  </div>

                  <div className="account-reference-field-group">
                    <Label
                      className="account-reference-label"
                      htmlFor="reference-last-name"
                    >
                      Last Name
                    </Label>
                    <div className="account-reference-control-shell">
                      <User className="account-reference-control-icon" />
                      <Input
                        className="account-reference-input"
                        defaultValue="Doe"
                        id="reference-last-name"
                        type="text"
                      />
                    </div>
                  </div>

                  <div className="account-reference-field-group account-reference-field-group--full">
                    <Label
                      className="account-reference-label"
                      htmlFor="reference-email"
                    >
                      Email Address
                    </Label>
                    <div className="account-reference-control-shell">
                      <Mail className="account-reference-control-icon" />
                      <Input
                        className="account-reference-input"
                        defaultValue="john.doe@example.com"
                        id="reference-email"
                        type="email"
                      />
                    </div>
                  </div>

                  <div className="account-reference-field-group account-reference-field-group--full">
                    <Label
                      className="account-reference-label"
                      htmlFor="reference-bio"
                    >
                      Short Bio
                    </Label>
                    <textarea
                      className="account-reference-textarea"
                      defaultValue="I build digital experiences and scalable infrastructure. Based out of San Francisco, loving open-source."
                      id="reference-bio"
                      rows={4}
                    />
                  </div>
                </div>
              </section>

              <hr className="account-reference-divider" />

              <section className="account-reference-section">
                <h3 className="account-reference-section-title">Professional Details</h3>

                <div className="account-reference-fields account-reference-fields--two">
                  <div className="account-reference-field-group">
                    <Label
                      className="account-reference-label"
                      htmlFor="reference-company"
                    >
                      Company
                    </Label>
                    <div className="account-reference-control-shell">
                      <Building className="account-reference-control-icon" />
                      <Input
                        className="account-reference-input"
                        defaultValue="Acme Corp"
                        id="reference-company"
                        type="text"
                      />
                    </div>
                  </div>

                  <div className="account-reference-field-group">
                    <Label
                      className="account-reference-label"
                      htmlFor="reference-location"
                    >
                      Location
                    </Label>
                    <div className="account-reference-control-shell">
                      <MapPin className="account-reference-control-icon" />
                      <Input
                        className="account-reference-input"
                        defaultValue="San Francisco, CA"
                        id="reference-location"
                        type="text"
                      />
                    </div>
                  </div>

                  <div className="account-reference-field-group account-reference-field-group--full">
                    <Label
                      className="account-reference-label"
                      htmlFor="reference-website"
                    >
                      Portfolio / Website
                    </Label>
                    <div className="account-reference-control-shell">
                      <Globe className="account-reference-control-icon" />
                      <Input
                        className={cn("account-reference-input", "account-reference-input--mono")}
                        defaultValue="https://johndoe.dev"
                        id="reference-website"
                        type="url"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <div className="account-reference-save-row">
                <Button
                  className="account-reference-save-button"
                  disabled={isSaving}
                  onClick={handleSave}
                  type="button"
                >
                  {isSaving ? "Saving Changes..." : "Save Changes"}
                </Button>
              </div>
            </div>

            <aside className="account-reference-sidebar">
              <section className="account-reference-card">
                <div className="account-reference-card-header">
                  <CheckCircle2 className="account-reference-card-icon account-reference-card-icon--success" />
                  <h4 className="account-reference-card-title">Profile Completeness</h4>
                </div>
                <div className="account-reference-progress-track">
                  <div className="account-reference-progress-bar" />
                </div>
                <p className="account-reference-card-copy">
                  85% Complete. Add a profile picture to reach 100%.
                </p>
              </section>

              <section className="account-reference-card account-reference-card--indigo">
                <div className="account-reference-card-header account-reference-card-header--tight">
                  <AlertCircle className="account-reference-card-icon account-reference-card-icon--indigo" />
                  <h4 className="account-reference-card-title account-reference-card-title--indigo">
                    Email Verification
                  </h4>
                </div>
                <p className="account-reference-card-copy account-reference-card-copy--indigo">
                  Your email address has not been verified yet. Please check your inbox.
                </p>
                <Button
                  className="account-reference-secondary-button"
                  type="button"
                  variant="outline"
                >
                  Resend Link
                </Button>
              </section>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

export default UserProfileOverviewReference;
