package az.bsq.model.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "schools")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class School extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String code;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
