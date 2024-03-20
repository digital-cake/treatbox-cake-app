<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductLeadTimeOverrideWeekday extends Model
{
    use HasFactory;

    protected $hidden = ['created_at', 'updated_at'];

    protected $fillable = [
        'override_id',
        'day_index',
        'lead_time',
        'cut_off_time',
        'post_cut_off_lead_time'
    ];

    public function productLeadTimeOverride()
    {
        return $this->belongsTo(ProductLeadTimeOverride::class);
    }
}
