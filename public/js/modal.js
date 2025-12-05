
function viewHospitalDetails(hospitalId) {
    // Show loading state
    $('#hospitalModalContent').html(`
        <div class="text-center">
            <div class="spinner-border" role="status">
                <span class="sr-only">Loading...</span>
            </div>
            <p>Loading hospital details...</p>
        </div>
    `);

    // Show modal first
    $('#hospitalDetailsModal').modal('show');

    // Fetch hospital details via AJAX
    fetch(`/admin/single/view/${hospitalId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.hospital) {
                populateHospitalModal(data.hospital);
            } else {
                $('#hospitalModalContent').html(`
                    <div class="alert alert-danger">
                        Error: ${data.message || 'Failed to load hospital details'}
                    </div>
                `);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            $('#hospitalModalContent').html(`
                <div class="alert alert-danger">
                    Error loading hospital details. Please try again.
                </div>
            `);
        });
}

function populateHospitalModal(hospital) {
    const content = `
        <div class="row">
            <div class="col-md-6">
                <h6>Basic Information</h6>
                <p><strong>Hospital Name:</strong> ${hospital.hospitalName || 'N/A'}</p>
                <p><strong>Address:</strong> ${hospital.address || 'N/A'}</p>
                <p><strong>Contact Email:</strong> ${hospital.contactEmail || 'N/A'}</p>
                <p><strong>Contact Phone:</strong> ${hospital.contactPhone || 'N/A'}</p>
                ${hospital.image ? `
                    <p><strong>Image:</strong></p>
                    <img src="${hospital.image}" alt="Hospital Image" 
                        class="img-thumbnail" style="max-width: 200px; max-height: 150px;">
                ` : ''}
            </div>
            <div class="col-md-6">
                 <h6>Staff Information</h6>
                <p><strong>Doctors:</strong> ${hospital.doctorCount || 0}</p>
                <p><strong>Nurses:</strong> ${hospital.nurseCount || 0}</p>
                <p><strong>Staff Members:</strong> ${hospital.staffCount || 0}</p>
                <p><strong>Total Staff:</strong> ${(hospital.doctorCount || 0) + (hospital.nurseCount || 0) + (hospital.staffCount || 0)}</p>
            </div>
        </div>
        

        ${hospital.staff && hospital.staff.length > 0 ? `
            <div class="row mt-4">
                <div class="col-12">
                    <h6>Staff Details</h6>
                    <div class="table-responsive">
                        <table class="table table-bordered table-striped table-hover">
                            <thead class="thead-dark">
                                <tr>
                                    <th>Name</th>
                                    <th>Role</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Department</th>
                                    <th>Specialization</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${hospital.staff.map(staff => `
                                    <tr>
                                        <td>${staff.name}</td>
                                        <td>
                                            <span class="badge ${staff.role === 'doctor' ? 'badge-primary' : staff.role === 'nurse' ? 'badge-success' : 'badge-info'}">
                                                ${staff.role}
                                            </span>
                                        </td>
                                        <td>${staff.email}</td>
                                        <td>${staff.phone}</td>
                                        <td>${staff.department || 'N/A'}</td>
                                        <td>${staff.specialization || 'N/A'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        ` : ''}
    `;

    $('#hospitalModalContent').html(content);
    $('#hospitalDetailsModalLabel').text(`Hospital Details - ${hospital.hospitalName}`);
}
