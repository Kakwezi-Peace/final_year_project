package com.carwash.service;

import com.carwash.dto.ServiceRequest;
import com.carwash.dto.ServiceResponse;
import com.carwash.repository.ServiceRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WashServiceService {

    private final ServiceRepository serviceRepository;

    @Transactional
    public ServiceResponse createService(ServiceRequest request) {
        if (serviceRepository.existsByName(request.getName())) {
            throw new RuntimeException("Service '" + request.getName() + "' already exists");
        }
        com.carwash.model.Service service = com.carwash.model.Service.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .durationMinutes(request.getDurationMinutes())
                .category(request.getCategory())
                .active(request.isActive())
                .build();

        service = serviceRepository.save(service);
        log.info("Service created: {}", service.getName());
        return toResponse(service);
    }

    public List<ServiceResponse> getAllServices() {
        return serviceRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ServiceResponse> getActiveServices() {
        return serviceRepository.findByActiveTrue().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ServiceResponse> getServicesByCategory(String category) {
        return serviceRepository.findByCategory(category).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public ServiceResponse getServiceById(Long id) {
        return toResponse(findById(id));
    }

    @Transactional
    public ServiceResponse updateService(Long id, ServiceRequest request) {
        com.carwash.model.Service service = findById(id);
        service.setName(request.getName());
        service.setDescription(request.getDescription());
        service.setPrice(request.getPrice());
        service.setDurationMinutes(request.getDurationMinutes());
        service.setCategory(request.getCategory());
        service.setActive(request.isActive());
        
        service = serviceRepository.save(service);
        log.info("Service updated: {}", service.getName());
        return toResponse(service);
    }

    @Transactional
    public void deleteService(Long id) {
        com.carwash.model.Service service = findById(id);
        serviceRepository.delete(service);
        log.info("Service deleted: id={}", id);
    }

    @Transactional
    public ServiceResponse toggleActive(Long id) {
        com.carwash.model.Service service = findById(id);
        service.setActive(!service.isActive());
        service = serviceRepository.save(service);
        return toResponse(service);
    }

    public com.carwash.model.Service findById(Long id) {
        return serviceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Service not found with id: " + id));
    }

    public ServiceResponse toResponse(com.carwash.model.Service s) {
        return ServiceResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .description(s.getDescription())
                .price(s.getPrice())
                .durationMinutes(s.getDurationMinutes())
                .category(s.getCategory())
                .active(s.isActive())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
