package com.mamoji.repository;

import com.mamoji.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByTypeOrderByIdAsc(Integer type);
    List<Category> findByFamilyIdOrIsSystem(Long familyId, Integer isSystem);
}
