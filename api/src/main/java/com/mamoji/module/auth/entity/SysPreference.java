package com.mamoji.module.auth.entity;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

import com.baomidou.mybatisplus.annotation.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** User Preference Entity */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("sys_preference")
public class SysPreference implements Serializable {

    @Serial private static final long serialVersionUID = 1L;

    /** Preference ID */
    @TableId(type = IdType.AUTO)
    private Long prefId;

    /** User ID (unique) */
    private Long userId;

    /** Default currency */
    private String currency;

    /** Timezone */
    private String timezone;

    /** Date format */
    private String dateFormat;

    /** Month start day */
    private Integer monthStart;

    /** Creation time */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** Last update time */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
