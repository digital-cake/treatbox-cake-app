<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DefaultProductLeadTime extends Model
{
    use HasFactory;

    protected $hidden = ['id', 'created_at', 'updated_at'];

    protected $fillable = [
        'day_index', 
        'lead_time',
        'cut_off_time',
        'post_cut_off_lead_time',
        'shop'
    ];
}
